/*
=============================================================================
🚫 LEGACY FILE - NOT CURRENTLY USED
=============================================================================
This file has been replaced by: UploadAssignmentOptimized.jsx
The enhanced version includes:
- Multi-file upload (up to 5 files)
- Image compression
- Better progress tracking
- Retry failed uploads
- Enhanced drag & drop

This file is kept for backup/reference purposes only.
=============================================================================

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

export default function UploadAssignment({ classId }) {
  const { currentUser, userProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("File type not supported. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG, ZIP");
      return false;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return false;
    }
    return true;
  };

  const pickFile = (f) => {
    setError(""); setSuccess("");
    if (f && validateFile(f)) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setError(""); setSuccess("");

    // Check for duplicate submission
    const q = query(
      collection(db, "assignments"),
      where("classId", "==", classId),
      where("studentId", "==", currentUser.uid),
      where("fileName", "==", file.name)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      setError("You have already submitted a file with this name. Rename your file to resubmit.");
      return;
    }

    setUploading(true);
    try {
      const storagePath = `assignments/${classId}/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
          },
          reject,
          resolve
        );
      });

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

      setSuccess(`"${file.name}" submitted successfully!`);
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-6 animate-fade-up">
      <h2 className="font-display font-bold text-white text-lg mb-1">Submit Assignment</h2>
      <p className="text-slate-500 text-sm mb-5">
        Upload your assignment file (PDF, DOC, DOCX, PPT, TXT, Image, ZIP — max {MAX_SIZE_MB} MB)
      </p>

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

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? "border-ink-500 bg-ink-600/10"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-slate-700/60 hover:border-slate-600 bg-slate-800/20 hover:bg-slate-800/40"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
          onChange={(e) => pickFile(e.target.files[0])}
        />
        {file ? (
          <div className="space-y-1">
            <div className="text-3xl mb-2">{fileIcon(file.type)}</div>
            <p className="font-display font-semibold text-white">{file.name}</p>
            <p className="text-slate-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-slate-600 text-xs mt-2">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📂</div>
            <p className="font-display font-semibold text-slate-300">Drop your file here</p>
            <p className="text-slate-500 text-sm">or click to browse</p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Uploading…</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-ink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full mt-4 py-3"
      >
        {uploading ? (
          <><Spinner /> Uploading {progress}%…</>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Submit Assignment
          </>
        )}
      </button>
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

=============================================================================
*/

// This file is commented out - using UploadAssignmentOptimized.jsx instead
export default function UploadAssignment() {
  return null;
}