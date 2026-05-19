import { useState } from "react";

export default function FilePreview({ file, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const isImage = file.fileType?.startsWith('image/');
    const isPDF = file.fileType?.includes('pdf');
    const isText = file.fileType?.includes('text');

    const handleLoad = () => setLoading(false);
    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{fileIcon(file.fileType)}</div>
                        <div>
                            <h3 className="font-display font-semibold text-white">{file.fileName}</h3>
                            <p className="text-slate-400 text-sm">
                                {file.studentName} • {formatFileSize(file.fileSize)} • {formatDate(file.submittedAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={file.fileURL}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary px-3 py-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="btn-secondary px-3 py-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-ink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-slate-400 text-sm">Loading preview...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="text-4xl mb-2">❌</div>
                                <p className="text-slate-400">Preview not available</p>
                                <p className="text-slate-500 text-sm mt-1">Click download to view the file</p>
                            </div>
                        </div>
                    )}

                    {isImage && (
                        <div className="p-4">
                            <img
                                src={file.fileURL}
                                alt={file.fileName}
                                className="max-w-full h-auto mx-auto rounded-lg"
                                onLoad={handleLoad}
                                onError={handleError}
                                style={{ display: loading ? 'none' : 'block' }}
                            />
                        </div>
                    )}

                    {isPDF && (
                        <iframe
                            src={`${file.fileURL}#toolbar=0`}
                            className="w-full h-full min-h-[600px]"
                            onLoad={handleLoad}
                            onError={handleError}
                            style={{ display: loading ? 'none' : 'block' }}
                        />
                    )}

                    {!isImage && !isPDF && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="text-6xl mb-4">{fileIcon(file.fileType)}</div>
                                <p className="text-slate-300 font-display font-semibold text-lg">{file.fileName}</p>
                                <p className="text-slate-400 text-sm mt-1">
                                    {file.fileType} • {formatFileSize(file.fileSize)}
                                </p>
                                <a
                                    href={file.fileURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-primary mt-4 inline-flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Open File
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function fileIcon(type = "") {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("sheet")) return "📊";
    if (type.includes("presentation")) return "📊";
    if (type.includes("image")) return "🖼️";
    if (type.includes("zip")) return "🗜️";
    if (type.includes("text")) return "📝";
    return "📎";
}

function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(timestamp) {
    if (!timestamp?.toDate) return "Unknown";
    return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}