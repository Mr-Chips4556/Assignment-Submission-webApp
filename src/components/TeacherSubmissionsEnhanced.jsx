import { useState, useEffect } from "react";
import {
    collection, query, where, onSnapshot, orderBy,
    doc, updateDoc, writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";
import FilePreview from "./FilePreview";

export default function TeacherSubmissionsEnhanced({ classId }) {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
    const [remarkOpen, setRemarkOpen] = useState(null);
    const [remarkText, setRemarkText] = useState("");
    const [marksGiven, setMarksGiven] = useState("");
    const [saving, setSaving] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [bulkRemarkText, setBulkRemarkText] = useState("");
    const [showBulkActions, setShowBulkActions] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, "assignments"),
            where("classId", "==", classId),
            orderBy("submittedAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return unsub;
    }, [classId]);

    const openRemark = (sub) => {
        setRemarkOpen(sub.id);
        setRemarkText(sub.remarks ?? "");
        setMarksGiven(sub.marksGiven ?? "");
    };

    const saveRemark = async (subId) => {
        setSaving(true);
        try {
            const updateData = {
                remarks: remarkText.trim(),
                status: "reviewed",
            };

            // Add marks if provided
            if (marksGiven.trim()) {
                updateData.marksGiven = parseInt(marksGiven) || 0;
            }

            await updateDoc(doc(db, "assignments", subId), updateData);
            setRemarkOpen(null);
            setRemarkText("");
            setMarksGiven("");
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (subId) => {
        setSelectedSubmissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subId)) {
                newSet.delete(subId);
            } else {
                newSet.add(subId);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        const filteredIds = filtered.map(s => s.id);
        setSelectedSubmissions(new Set(filteredIds));
    };

    const clearSelection = () => {
        setSelectedSubmissions(new Set());
    };

    const bulkMarkAsReviewed = async () => {
        if (selectedSubmissions.size === 0) return;

        setSaving(true);
        try {
            const batch = writeBatch(db);
            selectedSubmissions.forEach(subId => {
                const docRef = doc(db, "assignments", subId);
                batch.update(docRef, {
                    status: "reviewed",
                    remarks: bulkRemarkText.trim() || "Reviewed"
                });
            });
            await batch.commit();
            setSelectedSubmissions(new Set());
            setBulkRemarkText("");
            setShowBulkActions(false);
        } catch (error) {
            console.error("Bulk update failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const downloadAllSubmissions = () => {
        const selectedSubs = submissions.filter(s => selectedSubmissions.has(s.id));
        selectedSubs.forEach(sub => {
            const link = document.createElement('a');
            link.href = sub.fileURL;
            link.download = `${sub.studentName}_${sub.fileName}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const filtered = submissions.filter(sub => {
        const matchesFilter = filter === "all" || sub.status === filter;
        const matchesSearch = searchTerm === "" ||
            sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.fileName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const counts = {
        all: submissions.length,
        submitted: submissions.filter((s) => s.status === "submitted").length,
        reviewed: submissions.filter((s) => s.status === "reviewed").length,
    };

    return (
        <div className="space-y-5">
            {/* Stats and Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-up">
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-3 gap-3">
                    {[
                        { key: "all", label: "Total", icon: "📋", color: "ink" },
                        { key: "submitted", label: "Pending", icon: "⏳", color: "amber" },
                        { key: "reviewed", label: "Reviewed", icon: "✅", color: "emerald" },
                    ].map(({ key, label, icon, color }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`card p-4 text-center transition-all duration-200 hover:border-slate-600
                ${filter === key ? "border-ink-500/50 bg-ink-600/10" : ""}`}
                        >
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="font-mono font-bold text-white text-xl">{counts[key]}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="card p-4">
                    <input
                        type="text"
                        placeholder="Search students or files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field text-sm"
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedSubmissions.size > 0 && (
                <div className="card p-4 border-ink-500/30 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-ink-400 font-display font-semibold">
                                {selectedSubmissions.size} selected
                            </span>
                            <button onClick={clearSelection} className="text-slate-500 hover:text-slate-300 text-sm">
                                Clear
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={downloadAllSubmissions}
                                className="btn-secondary text-sm px-3 py-2"
                            >
                                📥 Download All
                            </button>
                            <button
                                onClick={() => setShowBulkActions(!showBulkActions)}
                                className="btn-primary text-sm px-3 py-2"
                            >
                                ✅ Mark as Reviewed
                            </button>
                        </div>
                    </div>

                    {showBulkActions && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <textarea
                                rows={2}
                                value={bulkRemarkText}
                                onChange={(e) => setBulkRemarkText(e.target.value)}
                                placeholder="Optional remarks for all selected submissions..."
                                className="input-field resize-none mb-3"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={bulkMarkAsReviewed}
                                    disabled={saving}
                                    className="btn-primary text-sm px-4 py-2"
                                >
                                    {saving ? <><Spinner /> Updating...</> : "Apply to Selected"}
                                </button>
                                <button
                                    onClick={() => setShowBulkActions(false)}
                                    className="btn-secondary text-sm px-4 py-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Submissions */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display font-bold text-white text-lg">
                        Submissions
                        {filter !== "all" && (
                            <span className={`ml-2 text-sm font-body ${filter === "reviewed" ? "text-emerald-400" : "text-amber-400"}`}>
                                — {filter}
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-3">
                        {filtered.length > 0 && (
                            <button
                                onClick={selectedSubmissions.size === filtered.length ? clearSelection : selectAll}
                                className="text-ink-400 hover:text-ink-300 text-sm font-medium"
                            >
                                {selectedSubmissions.size === filtered.length ? "Deselect All" : "Select All"}
                            </button>
                        )}
                        <span className="font-mono text-xs text-slate-500">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-slate-400 font-display font-semibold">No submissions found</p>
                        <p className="text-slate-600 text-sm mt-1">
                            {searchTerm ? "Try adjusting your search terms." :
                                filter === "all" ? "Students haven't submitted anything yet." : `No ${filter} submissions.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((sub) => (
                            <div key={sub.id} className="border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 transition-colors stagger-child">
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedSubmissions.has(sub.id)}
                                        onChange={() => toggleSelection(sub.id)}
                                        className="mt-1 w-4 h-4 text-ink-600 bg-slate-800 border-slate-600 rounded focus:ring-ink-500 focus:ring-2"
                                    />

                                    {/* Student avatar */}
                                    <div className="w-9 h-9 rounded-full bg-ink-700 border border-ink-500/40 flex items-center justify-center text-sm font-bold text-ink-200 shrink-0">
                                        {sub.studentName?.[0]?.toUpperCase() ?? "?"}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div>
                                                <p className="font-display font-semibold text-white text-sm">
                                                    {sub.studentName}
                                                </p>
                                                <button
                                                    onClick={() => setPreviewFile(sub)}
                                                    className="flex items-center gap-1 text-ink-400 hover:text-ink-300 text-xs mt-0.5 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {sub.fileName}
                                                </button>
                                                <p className="text-slate-600 text-xs font-mono mt-0.5">
                                                    {sub.submittedAt?.toDate
                                                        ? formatDate(sub.submittedAt.toDate())
                                                        : "…"}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={sub.status === "reviewed" ? "badge-reviewed" : "badge-submitted"}>
                                                    {sub.status === "reviewed" ? "✅ Reviewed" : "⏳ Pending"}
                                                </span>
                                                <a
                                                    href={sub.fileURL}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-secondary text-xs px-2 py-1"
                                                >
                                                    📥
                                                </a>
                                                <button
                                                    onClick={() => openRemark(sub)}
                                                    className="btn-secondary text-xs px-3 py-1.5"
                                                >
                                                    {sub.remarks ? "Edit" : "Add"} Remarks
                                                </button>
                                            </div>
                                        </div>

                                        {/* Existing remarks and marks */}
                                        {(sub.remarks || sub.marksGiven) && remarkOpen !== sub.id && (
                                            <div className="mt-3 pt-3 border-t border-slate-800/60">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        {sub.remarks && (
                                                            <>
                                                                <p className="text-xs font-display font-semibold text-slate-600 uppercase tracking-wider mb-1">Remarks</p>
                                                                <p className="text-slate-300 text-sm">💬 {sub.remarks}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    {sub.marksGiven !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-xs font-display font-semibold text-slate-600 uppercase tracking-wider mb-1">Marks</p>
                                                            <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                📊 {sub.marksGiven} marks
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Remark and marks editor */}
                                        {remarkOpen === sub.id && (
                                            <div className="mt-4 pt-4 border-t border-ink-500/20 animate-fade-in">
                                                <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    Grade & Feedback for {sub.studentName}
                                                </label>

                                                {/* Marks input */}
                                                <div className="mb-3">
                                                    <label className="block text-xs text-slate-500 mb-1">Marks Awarded</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Enter marks (e.g., 85)"
                                                        value={marksGiven}
                                                        onChange={(e) => setMarksGiven(e.target.value)}
                                                        className="input-field w-32"
                                                    />
                                                </div>

                                                {/* Remarks textarea */}
                                                <div className="mb-3">
                                                    <label className="block text-xs text-slate-500 mb-1">Feedback & Comments</label>
                                                    <textarea
                                                        rows={3}
                                                        value={remarkText}
                                                        onChange={(e) => setRemarkText(e.target.value)}
                                                        placeholder="Write your feedback here…"
                                                        className="input-field resize-none"
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveRemark(sub.id)}
                                                        disabled={saving || (!remarkText.trim() && !marksGiven.trim())}
                                                        className="btn-primary text-xs px-4 py-2"
                                                    >
                                                        {saving ? <><Spinner /> Saving…</> : "Save Grade & Feedback"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRemarkOpen(null);
                                                            setRemarkText("");
                                                            setMarksGiven("");
                                                        }}
                                                        className="btn-secondary text-xs px-4 py-2"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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