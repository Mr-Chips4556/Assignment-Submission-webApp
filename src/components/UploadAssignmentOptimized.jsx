import { useState, useRef, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { storage, db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
];
const MAX_SIZE_MB = 50;
const IMAGE_MAX_WIDTH = 1920;
const IMAGE_MAX_HEIGHT = 1080;
const IMAGE_QUALITY = 0.8;
const MAX_FILES = 5;

export default function UploadAssignmentOptimized({ classId }) {
    const { currentUser, userProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [processingImages, setProcessingImages] = useState(false);

    // Image compression utility
    const compressImage = useCallback((file) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
                    const ratio = Math.min(IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, file.type, IMAGE_QUALITY);
            };

            img.src = URL.createObjectURL(file);
        });
    }, []);

    const validateFile = (f) => {
        if (!ALLOWED_TYPES.includes(f.type)) {
            return { valid: false, error: "File type not supported. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG, WEBP, ZIP" };
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
            return { valid: false, error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.` };
        }
        return { valid: true };
    };

    const processFiles = async (fileList) => {
        setError("");
        setSuccess("");
        setProcessingImages(true);

        const processedFiles = [];

        for (const file of fileList) {
            const validation = validateFile(file);
            if (!validation.valid) {
                setError(validation.error);
                setProcessingImages(false);
                return;
            }

            let processedFile = file;

            // Compress images
            if (file.type.startsWith('image/')) {
                try {
                    const compressed = await compressImage(file);
                    if (compressed && compressed.size < file.size) {
                        processedFile = new File([compressed], file.name, { type: file.type });
                    }
                } catch (err) {
                    console.warn('Image compression failed:', err);
                }
            }

            processedFiles.push({
                file: processedFile,
                id: Date.now() + Math.random(),
                progress: 0,
                status: 'pending',
                error: null,
                originalSize: file.size,
                compressedSize: processedFile.size
            });
        }

        setFiles(processedFiles);
        setProcessingImages(false);
    };

    const pickFiles = (fileList) => {
        const filesArray = Array.from(fileList).slice(0, MAX_FILES);
        processFiles(filesArray);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const fileList = e.dataTransfer.files;
        if (fileList.length > 0) pickFiles(fileList);
    };

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const uploadFile = async (fileItem) => {
        const { file } = fileItem;

        // Check for duplicate submission
        const q = query(
            collection(db, "assignments"),
            where("classId", "==", classId),
            where("studentId", "==", currentUser.uid),
            where("fileName", "==", file.name)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error("You have already submitted a file with this name. Rename your file to resubmit.");
        }

        const storagePath = `assignments/${classId}/${currentUser.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snap) => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    setFiles(prev => prev.map(f =>
                        f.id === fileItem.id ? { ...f, progress: pct, status: 'uploading' } : f
                    ));
                },
                (error) => {
                    setFiles(prev => prev.map(f =>
                        f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
                    ));
                    reject(error);
                },
                async () => {
                    try {
                        const fileURL = await getDownloadURL(uploadTask.snapshot.ref);

                        await addDoc(collection(db, "assignments"), {
                            classId,
                            studentId: currentUser.uid,
                            studentName: userProfile?.name ?? "Unknown",
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            fileURL,
                            storagePath,
                            submittedAt: serverTimestamp(),
                            status: "submitted",
                            remarks: "",
                        });

                        setFiles(prev => prev.map(f =>
                            f.id === fileItem.id ? { ...f, status: 'completed' } : f
                        ));

                        resolve();
                    } catch (error) {
                        setFiles(prev => prev.map(f =>
                            f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
                        ));
                        reject(error);
                    }
                }
            );
        });
    };

    const handleUploadAll = async () => {
        if (files.length === 0) {
            setError("Please select files first.");
            return;
        }

        setError("");
        setSuccess("");
        setUploading(true);

        try {
            const pendingFiles = files.filter(f => f.status === 'pending');

            // Upload files sequentially to avoid overwhelming Firebase
            for (const fileItem of pendingFiles) {
                await uploadFile(fileItem);
            }

            // Count successful uploads
            const completedFiles = files.filter(f => f.status === 'completed');
            const newlyCompleted = pendingFiles.length; // All pending files should now be completed

            if (newlyCompleted > 0) {
                setSuccess(`Assignment${newlyCompleted !== 1 ? 's' : ''} submitted successfully! 🎉`);
            }

            // Clear completed files after a delay
            setTimeout(() => {
                setFiles(prev => prev.filter(f => f.status !== 'completed'));
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 2000);

        } catch (err) {
            console.error(err);
            setError("Some uploads failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const retryFailedUploads = async () => {
        const failedFiles = files.filter(f => f.status === 'error');
        if (failedFiles.length === 0) return;

        setUploading(true);
        try {
            for (const fileItem of failedFiles) {
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'pending', error: null, progress: 0 } : f
                ));
                await uploadFile(fileItem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    const compressionSavings = files.reduce((sum, f) => sum + (f.originalSize - f.compressedSize), 0);

    return (
        <div className="card p-6 animate-fade-up">
            <h2 className="font-display font-bold text-white text-lg mb-1">Submit Assignment</h2>
            <p className="text-slate-500 text-sm mb-5">
                Upload your assignment files (PDF, DOC, DOCX, PPT, TXT, Images, ZIP — max {MAX_SIZE_MB} MB each, up to {MAX_FILES} files)
            </p>

            {/* Alerts */}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    ⚠️ {error}
                </div>
            )}
            {success && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    ✅ {success}
                </div>
            )}

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragging
                        ? "border-ink-500 bg-ink-600/10"
                        : files.length > 0
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-slate-700/60 hover:border-slate-600 bg-slate-800/20 hover:bg-slate-800/40"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.zip"
                    onChange={(e) => pickFiles(e.target.files)}
                />

                {processingImages ? (
                    <div className="space-y-2">
                        <div className="text-3xl">⚙️</div>
                        <p className="font-display font-semibold text-white">Processing images...</p>
                        <p className="text-slate-500 text-sm">Optimizing file sizes</p>
                    </div>
                ) : files.length > 0 ? (
                    <div className="space-y-1">
                        <div className="text-3xl mb-2">📁</div>
                        <p className="font-display font-semibold text-white">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                        <p className="text-slate-500 text-xs">{(totalSize / (1024 * 1024)).toFixed(2)} MB total</p>
                        {compressionSavings > 0 && (
                            <p className="text-emerald-400 text-xs">💾 Saved {(compressionSavings / (1024 * 1024)).toFixed(2)} MB through compression</p>
                        )}
                        <p className="text-slate-600 text-xs mt-2">Click to add more files</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-4xl">📂</div>
                        <p className="font-display font-semibold text-slate-300">Drop your files here</p>
                        <p className="text-slate-500 text-sm">or click to browse (up to {MAX_FILES} files)</p>
                    </div>
                )}
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((fileItem) => (
                        <div key={fileItem.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                            <div className="text-lg">{fileIcon(fileItem.file.type)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-medium text-white text-sm truncate">
                                    {fileItem.file.name}
                                </p>
                                <p className="text-slate-500 text-xs">
                                    {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB
                                    {fileItem.originalSize !== fileItem.compressedSize && (
                                        <span className="text-emerald-400 ml-1">
                                            (compressed from {(fileItem.originalSize / (1024 * 1024)).toFixed(2)} MB)
                                        </span>
                                    )}
                                </p>
                                {fileItem.status === 'uploading' && (
                                    <div className="mt-1">
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 bg-ink-500 rounded-full transition-all duration-300"
                                                style={{ width: `${fileItem.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {fileItem.error && (
                                    <p className="text-red-400 text-xs mt-1">❌ {fileItem.error}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {fileItem.status === 'completed' && (
                                    <span className="text-emerald-400 text-sm">✅</span>
                                )}
                                {fileItem.status === 'error' && (
                                    <span className="text-red-400 text-sm">❌</span>
                                )}
                                {fileItem.status === 'pending' && (
                                    <button
                                        onClick={() => removeFile(fileItem.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action buttons */}
            {files.length > 0 && (
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleUploadAll}
                        disabled={uploading || files.every(f => f.status === 'completed')}
                        className="btn-primary flex-1 py-3"
                    >
                        {uploading ? (
                            <><Spinner /> Uploading...</>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload All Files
                            </>
                        )}
                    </button>

                    {files.some(f => f.status === 'error') && (
                        <button
                            onClick={retryFailedUploads}
                            disabled={uploading}
                            className="btn-secondary px-4 py-3"
                        >
                            🔄 Retry Failed
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function fileIcon(type) {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("sheet")) return "📊";
    if (type.includes("presentation")) return "📊";
    if (type.includes("image")) return "🖼️";
    if (type.includes("zip")) return "🗜️";
    return "📎";
}

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}