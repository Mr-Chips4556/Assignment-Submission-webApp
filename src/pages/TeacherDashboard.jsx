import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";

// Generate a random 6-char class code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeacherDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [className, setClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleting, setDeleting] = useState(null); // Track which class is being deleted

  const loadClasses = async () => {
    setLoading(true);
    const q = query(
      collection(db, "classes"),
      where("teacherId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadClasses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const code = generateCode();
      await addDoc(collection(db, "classes"), {
        name: className.trim(),
        teacherId: currentUser.uid,
        teacherName: userProfile?.name ?? "",
        code,
        studentIds: [],
        createdAt: serverTimestamp(),
      });
      setClassName("");
      setShowCreate(false);
      loadClasses();
    } catch {
      setCreateError("Failed to create class. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (classToDelete) => {
    const confirmMessage = `Are you sure you want to delete "${classToDelete.name}"?\n\nThis will:\n• Remove the class for all students\n• Delete all assignments in this class\n• This action cannot be undone`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(classToDelete.id);
    try {
      const batch = writeBatch(db);

      // 1. Delete all assignments in this class
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("classId", "==", classToDelete.id)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      assignmentsSnap.docs.forEach((assignmentDoc) => {
        batch.delete(doc(db, "assignments", assignmentDoc.id));
      });

      // 2. Delete the class itself
      batch.delete(doc(db, "classes", classToDelete.id));

      // Execute all deletions
      await batch.commit();

      // Reload classes to update UI
      loadClasses();

      console.log(`Successfully deleted class "${classToDelete.name}" and ${assignmentsSnap.docs.length} assignments`);
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <p className="text-slate-400 text-sm font-body mb-1">Welcome back,</p>
            <h1 className="section-title text-3xl">{userProfile?.name ?? "Teacher"} 👨‍🏫</h1>
            <p className="text-slate-400 mt-1">Manage your classes and review student assignments</p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="btn-primary shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Class
          </button>
        </div>

        {/* Create class panel */}
        {showCreate && (
          <div className="card p-6 mb-6 border-ink-500/30 animate-fade-up">
            <h3 className="font-display font-bold text-white mb-4">Create a New Class</h3>
            {createError && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="Class name (e.g. Mathematics — Grade 10)"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="input-field flex-1"
              />
              <button type="submit" disabled={creating} className="btn-primary shrink-0">
                {creating ? <><Spinner /> Creating…</> : "Create"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary shrink-0">
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Classes grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
          ) : classes.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 card p-12 text-center">
              <div className="text-5xl mb-4">🏫</div>
              <p className="font-display font-semibold text-white text-lg">No classes yet</p>
              <p className="text-slate-500 text-sm mt-1">Create your first class to get started.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="card p-6 flex flex-col gap-4 stagger-child relative group"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClass(cls);
                  }}
                  disabled={deleting === cls.id}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Delete class"
                >
                  {deleting === cls.id ? (
                    <Spinner />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                {/* Class card content - clickable link */}
                <Link
                  to={`/teacher/class/${cls.id}`}
                  className="flex flex-col gap-4 group-hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl">
                      🏫
                    </div>
                    <span className="badge bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      Teacher
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-white hover:text-ink-300 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {cls.studentIds?.length ?? 0} student{cls.studentIds?.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">Class Code</p>
                      <span className="font-mono text-sm font-bold text-ink-400 tracking-widest">
                        {cls.code}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-slate-600 hover:text-ink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
