import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null); // Track which class is being left

  // Load enrolled classes
  const loadClasses = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "classes"),
        where("studentIds", "array-contains", currentUser.uid)
      );
      const snap = await getDocs(q);
      const list = [];

      for (const d of snap.docs) {
        const data = d.data();
        // Get teacher name
        let teacherName = "Unknown Teacher";
        try {
          const tSnap = await getDoc(doc(db, "users", data.teacherId));
          if (tSnap.exists()) {
            teacherName = tSnap.data().name || teacherName;
          }
        } catch (error) {
          console.error("Error fetching teacher name:", error);
        }
        list.push({ id: d.id, ...data, teacherName });
      }
      setClasses(list);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [currentUser]);

  // Join class by code
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinError("");
    setJoinSuccess("");
    setJoining(true);

    try {
      const q = query(
        collection(db, "classes"),
        where("code", "==", joinCode.trim().toUpperCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setJoinError("Class not found. Check the code and try again.");
        return;
      }

      const classDoc = snap.docs[0];
      const data = classDoc.data();

      if (data.studentIds?.includes(currentUser.uid)) {
        setJoinError("You are already enrolled in this class.");
        return;
      }

      await updateDoc(doc(db, "classes", classDoc.id), {
        studentIds: arrayUnion(currentUser.uid),
      });

      setJoinSuccess(`Joined "${data.name}" successfully!`);
      setJoinCode("");
      loadClasses();
    } catch (error) {
      console.error("Error joining class:", error);
      setJoinError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // Leave class function
  const handleLeaveClass = async (classToLeave) => {
    const confirmMessage = `Are you sure you want to leave "${classToLeave.name}"?\n\nYou will:\n• No longer receive assignments from this class\n• Not be able to submit new assignments\n• Your previous submissions will remain with the teacher\n\nYou can rejoin later with the class code.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLeaving(classToLeave.id);
    try {
      // Remove student from class studentIds array
      await updateDoc(doc(db, "classes", classToLeave.id), {
        studentIds: arrayRemove(currentUser.uid),
      });

      // Add to leftStudents array to track who left (for teacher visibility)
      const classDoc = await getDoc(doc(db, "classes", classToLeave.id));
      const classData = classDoc.data();
      const leftStudents = classData.leftStudents || [];

      // Add student info to leftStudents if not already there
      const studentInfo = {
        studentId: currentUser.uid,
        studentName: userProfile?.name ?? "Unknown Student",
        leftAt: new Date().toISOString()
      };

      if (!leftStudents.some(s => s.studentId === currentUser.uid)) {
        await updateDoc(doc(db, "classes", classToLeave.id), {
          leftStudents: arrayUnion(studentInfo)
        });
      }

      // Reload classes to update UI
      loadClasses();

      console.log(`Successfully left class "${classToLeave.name}"`);
    } catch (error) {
      console.error("Error leaving class:", error);
      alert("Failed to leave class. Please try again.");
    } finally {
      setLeaving(null);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-content">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p className="text-slate-400 text-sm font-body mb-1">Good to see you,</p>
          <h1 className="section-title text-3xl">
            {userProfile?.name ?? "Student"} 👋
          </h1>
          <p className="text-slate-400 mt-1">Manage your enrolled classes and assignments</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Classes list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="section-title text-xl">My Classes</h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-24 rounded-xl" />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-300 font-display font-semibold">No classes yet</p>
                <p className="text-slate-500 text-sm mt-1">Join a class using the code your teacher shared.</p>

                {/* Debug info */}
                <div className="mt-4 p-3 bg-slate-800 rounded text-xs text-left">
                  <p className="text-slate-400">Debug Info:</p>
                  <p className="text-slate-300">User ID: {currentUser?.uid}</p>
                  <p className="text-slate-300">User Role: {userProfile?.role}</p>
                  <p className="text-slate-300">Classes Found: {classes.length}</p>
                  <p className="text-slate-300">Loading: {loading.toString()}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="card p-5 flex items-center justify-between group stagger-child relative"
                  >
                    {/* Leave button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLeaveClass(cls);
                      }}
                      disabled={leaving === cls.id}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Leave class"
                    >
                      {leaving === cls.id ? (
                        <Spinner />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                    </button>

                    {/* Class content - clickable link */}
                    <Link
                      to={`/student/class/${cls.id}`}
                      className="flex items-center gap-4 flex-1 group-hover:opacity-90 transition-opacity"
                    >
                      <div className="w-11 h-11 rounded-xl bg-ink-600/20 border border-ink-500/30 flex items-center justify-center text-xl">
                        🏫
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-white group-hover:text-ink-300 transition-colors">
                          {cls.name}
                        </p>
                        <p className="text-slate-500 text-sm mt-0.5">
                          👨‍🏫 {cls.teacherName} &nbsp;·&nbsp;
                          <span className="font-mono text-xs text-slate-600">{cls.code}</span>
                        </p>
                      </div>
                    </Link>

                    <svg className="w-5 h-5 text-slate-600 group-hover:text-ink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Join class panel */}
          <div>
            <div className="card p-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="font-display font-bold text-white text-lg mb-1">Join a Class</h2>
              <p className="text-slate-500 text-sm mb-5">Enter the class code provided by your teacher.</p>

              {joinError && (
                <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {joinError}
                </div>
              )}
              {joinSuccess && (
                <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  ✅ {joinSuccess}
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Class code (e.g. AB12CD)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="input-field font-mono tracking-widest uppercase"
                />
                <button type="submit" disabled={joining} className="btn-primary w-full">
                  {joining ? <><Spinner /> Joining…</> : "Join Class"}
                </button>
              </form>
            </div>

            {/* Stats card */}
            <div className="card p-6 mt-4">
              <p className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-4">Overview</p>
              <div className="space-y-3">
                <StatRow label="Enrolled Classes" value={classes.length} icon="🏫" />
                <StatRow label="Account Status" value="✅ Active" icon="🔐" />
                <StatRow label="User Role" value={userProfile?.role ?? "Unknown"} icon="👤" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400 text-sm">{icon} {label}</div>
      <span className="font-mono font-bold text-white">{value}</span>
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