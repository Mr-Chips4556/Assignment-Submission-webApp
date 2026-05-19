/*
=============================================================================
🚫 LEGACY FILE - NOT CURRENTLY USED
=============================================================================
This file has been replaced by: ClassPageEnhanced.jsx
The enhanced version includes:
- Tabbed interface for better navigation
- Analytics tab for teachers
- Copy class code functionality
- Better mobile responsiveness
- Enhanced UI/UX

This file is kept for backup/reference purposes only.
=============================================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import UploadAssignment  from "../components/UploadAssignment";
import StudentSubmissions from "../components/StudentSubmissions";
import TeacherSubmissions from "../components/TeacherSubmissions";

export default function ClassPage() {
  const { classId }    = useParams();
  const { role }       = useAuth();
  const navigate       = useNavigate();
  const [cls, setCls]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "classes", classId));
      if (!snap.exists()) { navigate(-1); return; }
      setCls({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    load();
  }, [classId]);

  if (loading) return (
    <div className="page-container">
      <Navbar />
      <div className="main-content space-y-4">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-content">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-body mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="card p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ink-600/20 border border-ink-500/30 flex items-center justify-center text-3xl">
              🏫
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">{cls.name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {role === "teacher" ? (
                  <>{cls.studentIds?.length ?? 0} enrolled students</>
                ) : (
                  <>👨‍🏫 {cls.teacherName}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-slate-600 font-body">Class Code</p>
            <span className="font-mono text-xl font-bold text-ink-400 tracking-widest">
              {cls.code}
            </span>
          </div>
        </div>

        {role === "student" ? (
          <div className="space-y-6">
            <UploadAssignment classId={classId} />
            <StudentSubmissions classId={classId} />
          </div>
        ) : (
          <TeacherSubmissions classId={classId} />
        )}
      </div>
    </div>
  );
}

=============================================================================
*/

// This file is commented out - using ClassPageEnhanced.jsx instead
export default function ClassPage() {
  return null;
}