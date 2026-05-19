/*
=============================================================================
🚫 LEGACY FILE - NOT CURRENTLY USED
=============================================================================
This file has been replaced by: StudentSubmissionsEnhanced.jsx
The enhanced version includes:
- File preview functionality
- Delete submissions before review
- Better file management
- Statistics display
- Enhanced UI/UX

This file is kept for backup/reference purposes only.
=============================================================================

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

export default function StudentSubmissions({ classId }) {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "assignments"),
      where("classId",   "==", classId),
      where("studentId", "==", currentUser.uid),
      orderBy("submittedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [classId, currentUser.uid]);

  return (
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
          {submissions.map((sub) => (
            <div key={sub.id} className="card p-4 stagger-child">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xl shrink-0">
                    {fileIcon(sub.fileType)}
                  </div>
                  <div>
                    <a
                      href={sub.fileURL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-display font-semibold text-white hover:text-ink-300 transition-colors text-sm"
                    >
                      {sub.fileName}
                    </a>
                    <p className="text-slate-600 text-xs font-mono mt-0.5">
                      {sub.submittedAt?.toDate
                        ? formatDate(sub.submittedAt.toDate())
                        : "Submitting…"}
                      {sub.fileSize && (
                        <> · {(sub.fileSize / (1024 * 1024)).toFixed(2)} MB</>
                      )}
                    </p>
                  </div>
                </div>

                <span className={sub.status === "reviewed" ? "badge-reviewed shrink-0" : "badge-submitted shrink-0"}>
                  {sub.status === "reviewed" ? "✅ Reviewed" : "⏳ Awaiting review"}
                </span>
              </div>

              {sub.remarks && (
                <div className="mt-3 pt-3 border-t border-slate-800/60">
                  <p className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Teacher's Remarks
                  </p>
                  <p className="text-slate-300 text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                    💬 {sub.remarks}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fileIcon(type = "") {
  if (type.includes("pdf"))   return "📄";
  if (type.includes("word"))  return "📝";
  if (type.includes("image")) return "🖼️";
  if (type.includes("zip"))   return "🗜️";
  return "📎";
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

=============================================================================
*/

// This file is commented out - using StudentSubmissionsEnhanced.jsx instead
export default function StudentSubmissions() {
  return null;
}