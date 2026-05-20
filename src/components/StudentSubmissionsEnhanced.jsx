import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import FilePreview from "./FilePreview";

export default function StudentSubmissionsEnhanced({ classId }) {
    const { currentUser } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const q = query(
            collection(db, "assignments"),
            where("classId", "==", classId),
            where("studentId", "==", currentUser.uid),
            orderBy("submittedAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return unsub;
    }, [classId, currentUser.uid]);

    const deleteSubmission = async (submission) => {
        if (!confirm(`Are you sure you want to delete "${submission.fileName}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(submission.id);
        try {
            // Delete from storage
            if (submission.storagePath) {
                const storageRef = ref(storage, submission.storagePath);
                await deleteObject(storageRef);
            }

            // Delete from Firestore
            await deleteDoc(doc(db, "assignments", submission.id));
        } catch (error) {
            console.error("Error deleting submission:", error);
            alert("Failed to delete submission. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusInfo = (submission) => {
        if (submission.status === "reviewed") {
            return {
                badge: "badge-reviewed",
                text: "✅ Reviewed",
                description: "Your teacher has reviewed this submission"
            };
        }
        return {
            badge: "badge-submitted",
            text: "⏳ Awaiting review",
            description: "Waiting for teacher review"
        };
    };

    const totalSize = submissions.reduce((sum, sub) => sum + (sub.fileSize || 0), 0);
    const reviewedCount = submissions.filter(sub => sub.status === "reviewed").length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">📁</div>
                    <div className="font-mono font-bold text-white text-xl">{submissions.length}</div>
                    <div className="text-slate-500 text-xs">Total Files</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="font-mono font-bold text-white text-xl">{reviewedCount}</div>
                    <div className="text-slate-500 text-xs">Reviewed</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">💾</div>
                    <div className="font-mono font-bold text-white text-xl">
                        {(totalSize / (1024 * 1024)).toFixed(1)}
                    </div>
                    <div className="text-slate-500 text-xs">MB Used</div>
                </div>
            </div>

            {/* Submissions */}
            <div className="card p-6">
                <h2 className="font-display font-bold text-white text-lg mb-5">My Submissions</h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-slate-400 font-display font-semibold">No submissions yet</p>
                        <p className="text-slate-600 text-sm mt-1">Upload your assignment above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {submissions.map((sub) => {
                            const statusInfo = getStatusInfo(sub);
                            return (
                                <div key={sub.id} className="card p-4 stagger-child hover:border-slate-700/60 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        {/* File info */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xl shrink-0">
                                                {fileIcon(sub.fileType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => setPreviewFile(sub)}
                                                    className="font-display font-semibold text-white hover:text-ink-300 transition-colors text-sm text-left truncate block w-full"
                                                >
                                                    {sub.fileName}
                                                </button>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-slate-600 text-xs font-mono">
                                                        {sub.submittedAt?.toDate
                                                            ? formatDate(sub.submittedAt.toDate())
                                                            : "Submitting…"}
                                                    </p>
                                                    {sub.fileSize && (
                                                        <>
                                                            <span className="text-slate-700">•</span>
                                                            <p className="text-slate-600 text-xs">
                                                                {(sub.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`${statusInfo.badge} text-xs`}>
                                                        {statusInfo.text}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setPreviewFile(sub)}
                                                className="btn-secondary text-xs px-3 py-1.5"
                                                title="Preview file"
                                            >
                                                👁️ Preview
                                            </button>
                                            <a
                                                href={sub.fileURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn-secondary text-xs px-3 py-1.5"
                                                title="Download file"
                                            >
                                                📥 Download
                                            </a>
                                            {sub.status === "submitted" && (
                                                <button
                                                    onClick={() => deleteSubmission(sub)}
                                                    disabled={deletingId === sub.id}
                                                    className="btn-danger text-xs px-3 py-1.5"
                                                    title="Delete submission"
                                                >
                                                    {deletingId === sub.id ? (
                                                        <><Spinner /> Deleting...</>
                                                    ) : (
                                                        "🗑️ Delete"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remarks and Marks */}
                                    {(sub.remarks || sub.marksGiven !== undefined) && (
                                        <div className="mt-4 pt-4 border-t border-slate-800/60">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <p className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
                                                    Teacher&apos;s Feedback
                                                </p>
                                                {sub.marksGiven !== undefined && (
                                                    <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                                                        📊 {sub.marksGiven} marks
                                                    </span>
                                                )}
                                            </div>
                                            {sub.remarks && (
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3">
                                                    <p className="text-slate-300 text-sm">💬 {sub.remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Status description */}
                                    <div className="mt-2 pt-2 border-t border-slate-800/60">
                                        <p className="text-slate-500 text-xs">{statusInfo.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreview
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
}

function fileIcon(type = "") {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("image")) return "🖼️";
    if (type.includes("zip")) return "🗜️";
    if (type.includes("presentation")) return "📊";
    if (type.includes("text")) return "📝";
    return "📎";
}

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function Spinner() {
    return (
        <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}