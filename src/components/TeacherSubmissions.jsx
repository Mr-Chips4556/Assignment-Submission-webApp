/*
=============================================================================
🚫 LEGACY FILE - NOT CURRENTLY USED
=============================================================================
This file has been replaced by: TeacherSubmissionsEnhanced.jsx
The enhanced version includes:
- Bulk operations (select multiple submissions)
- Advanced search and filtering
- Download multiple files at once
- Bulk remarks functionality
- File preview integration
- Better UI/UX

This file is kept for backup/reference purposes only.
=============================================================================

import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function TeacherSubmissions({ classId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all"); // all | submitted | reviewed
  const [remarkOpen, setRemarkOpen]   = useState(null);  // submission id
  const [remarkText, setRemarkText]   = useState("");
  const [saving, setSaving]           = useState(false);

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
  };

  const saveRemark = async (subId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "assignments", subId), {
        remarks: remarkText.trim(),
        status:  "reviewed",
      });
      setRemarkOpen(null);
      setRemarkText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === "all"
    ? submissions
    : submissions.filter((s) => s.status === filter);

  const counts = {
    all:       submissions.length,
    submitted: submissions.filter((s) => s.status === "submitted").length,
    reviewed:  submissions.filter((s) => s.status === "reviewed").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        {[
          { key: "all",       label: "Total",    icon: "📋", color: "ink" },
          { key: "submitted", label: "Pending",  icon: "⏳", color: "amber" },
          { key: "reviewed",  label: "Reviewed", icon: "✅", color: "emerald" },
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
          <span className="font-mono text-xs text-slate-500">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-slate-400 font-display font-semibold">No submissions yet</p>
            <p className="text-slate-600 text-sm mt-1">
              {filter === "all"
                ? "Students haven't submitted anything yet."
                : `No ${filter} submissions.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => (
              <div key={sub.id} className="border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 transition-colors stagger-child">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-ink-700 border border-ink-500/40 flex items-center justify-center text-sm font-bold text-ink-200 shrink-0">
                      {sub.studentName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-white text-sm">
                        {sub.studentName}
                      </p>
                      <a
                        href={sub.fileURL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-ink-400 hover:text-ink-300 text-xs mt-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {sub.fileName}
                      </a>
                      <p className="text-slate-600 text-xs font-mono mt-0.5">
                        {sub.submittedAt?.toDate
                          ? formatDate(sub.submittedAt.toDate())
                          : "…"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={sub.status === "reviewed" ? "badge-reviewed" : "badge-submitted"}>
                      {sub.status === "reviewed" ? "✅ Reviewed" : "⏳ Pending"}
                    </span>
                    <button
                      onClick={() => openRemark(sub)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      {sub.remarks ? "Edit Remarks" : "Add Remarks"}
                    </button>
                  </div>
                </div>

                {sub.remarks && remarkOpen !== sub.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <p className="text-xs font-display font-semibold text-slate-600 uppercase tracking-wider mb-1">Remarks</p>
                    <p className="text-slate-300 text-sm">💬 {sub.remarks}</p>
                  </div>
                )}

                {remarkOpen === sub.id && (
                  <div className="mt-4 pt-4 border-t border-ink-500/20 animate-fade-in">
                    <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Remarks for {sub.studentName}
                    </label>
                    <textarea
                      rows={3}
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      placeholder="Write your feedback here…"
                      className="input-field resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveRemark(sub.id)}
                        disabled={saving || !remarkText.trim()}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        {saving ? <><Spinner /> Saving…</> : "Save Remarks"}
                      </button>
                      <button
                        onClick={() => { setRemarkOpen(null); setRemarkText(""); }}
                        className="btn-secondary text-xs px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

=============================================================================
*/

// This file is commented out - using TeacherSubmissionsEnhanced.jsx instead
export default function TeacherSubmissions() {
  return null;
}