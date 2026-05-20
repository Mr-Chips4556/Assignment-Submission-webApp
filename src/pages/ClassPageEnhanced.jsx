import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import UploadAssignmentOptimized from "../components/UploadAssignmentOptimized";
import StudentSubmissionsEnhanced from "../components/StudentSubmissionsEnhanced";
import TeacherSubmissionsEnhanced from "../components/TeacherSubmissionsEnhanced";

export default function ClassPageEnhanced() {
    const { classId } = useParams();
    const { role } = useAuth();
    const navigate = useNavigate();
    const [cls, setCls] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(role === "student" ? "assignments" : "submissions");

    useEffect(() => {
        const load = async () => {
            const snap = await getDoc(doc(db, "classes", classId));
            if (!snap.exists()) {
                navigate(-1);
                return;
            }
            setCls({ id: snap.id, ...snap.data() });
            setLoading(false);
        };
        load();
    }, [classId, navigate]);

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

    const tabs = role === "student"
        ? [
            { id: "assignments", label: "View Assignments", icon: "📋" },
            { id: "upload", label: "Submit Assignment", icon: "📤" },
            { id: "submissions", label: "My Submissions", icon: "📊" }
        ]
        : [
            { id: "submissions", label: "All Submissions", icon: "📋" },
            { id: "assignments", label: "Create Assignment", icon: "📝" },
            { id: "students", label: "Class Management", icon: "👥" },
            { id: "analytics", label: "Analytics", icon: "📊" }
        ];

    return (
        <div className="page-container">
            <Navbar />
            <div className="main-content">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate(role === "teacher" ? "/teacher" : "/student")}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-body mb-6 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>

                {/* Class header */}
                <div className="card p-6 mb-6 animate-fade-up">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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

                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-600 font-body mb-1">Class Code</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xl font-bold text-ink-400 tracking-widest">
                                        {cls.code}
                                    </span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(cls.code)}
                                        className="text-slate-500 hover:text-ink-400 transition-colors"
                                        title="Copy class code"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-slate-800/40 rounded-xl border border-slate-700/60 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-display font-medium text-sm transition-all duration-200
                ${activeTab === tab.id
                                    ? "bg-ink-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                    {role === "student" ? (
                        <>
                            {activeTab === "assignments" && <ViewAssignments classId={classId} />}
                            {activeTab === "upload" && <UploadAssignmentOptimized classId={classId} />}
                            {activeTab === "submissions" && <StudentSubmissionsEnhanced classId={classId} />}
                        </>
                    ) : (
                        <>
                            {activeTab === "submissions" && <TeacherSubmissionsEnhanced classId={classId} />}
                            {activeTab === "assignments" && <CreateAssignment classId={classId} />}
                            {activeTab === "students" && <ClassManagement classId={classId} cls={cls} />}
                            {activeTab === "analytics" && <ClassAnalytics classId={classId} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Create Assignment component for teachers
function CreateAssignment({ classId }) {
    const { currentUser, userProfile } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [totalMarks, setTotalMarks] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB for assignment files)
            if (file.size > 10 * 1024 * 1024) {
                setError("File too large. Maximum size is 10MB.");
                return;
            }
            setAttachmentFile(file);
            setError("");
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !totalMarks) {
            setError("Please fill in all required fields.");
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");

        try {
            const assignmentData = {
                classId,
                teacherId: currentUser.uid,
                teacherName: userProfile?.name ?? "Unknown Teacher",
                title: title.trim(),
                description: description.trim(),
                totalMarks: parseInt(totalMarks),
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                hasAttachment: !!attachmentFile,
                attachmentName: attachmentFile?.name || null,
                createdAt: serverTimestamp(),
                status: "active"
            };

            // For now, we'll store the assignment without file upload
            // In a full implementation, you'd upload the file to Firebase Storage first
            await addDoc(collection(db, "classAssignments"), assignmentData);

            setSuccess("Assignment created successfully!");
            setTitle("");
            setDescription("");
            setTotalMarks("");
            setDueDate("");
            setAttachmentFile(null);

            // Reset file input
            const fileInput = document.getElementById("assignment-file");
            if (fileInput) fileInput.value = "";

        } catch (error) {
            console.error("Error creating assignment:", error);
            setError("Failed to create assignment. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4">Create New Assignment</h3>

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

                <form onSubmit={handleCreateAssignment} className="space-y-4">
                    {/* Assignment Title */}
                    <div>
                        <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Assignment Title *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Math Homework Chapter 5"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* Assignment Description */}
                    <div>
                        <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Description & Instructions *
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Provide detailed instructions for the assignment..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Total Marks and Due Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Total Marks *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="1000"
                                placeholder="e.g., 100"
                                value={totalMarks}
                                onChange={(e) => setTotalMarks(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Due Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* File Attachment */}
                    <div>
                        <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Attachment (Optional)
                        </label>
                        <input
                            id="assignment-file"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                            className="input-field"
                        />
                        {attachmentFile && (
                            <p className="text-emerald-400 text-sm mt-2">
                                📎 {attachmentFile.name} ({(attachmentFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={creating}
                        className="btn-primary w-full py-3"
                    >
                        {creating ? (
                            <><Spinner /> Creating Assignment...</>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Assignment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// View Assignments component for students
function ViewAssignments({ classId }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "classAssignments"),
            where("classId", "==", classId),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const assignmentList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssignments(assignmentList);
            setLoading(false);
        });

        return unsubscribe;
    }, [classId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-32 rounded-xl" />
                <div className="skeleton h-32 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4">
                    Class Assignments ({assignments.length})
                </h3>

                {assignments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-slate-400 font-display font-semibold">No assignments yet</p>
                        <p className="text-slate-600 text-sm mt-1">Your teacher hasn't assigned any work yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="card p-5 border border-slate-700/60">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-display font-semibold text-white text-lg">
                                            {assignment.title}
                                        </h4>
                                        <p className="text-slate-500 text-sm mt-1">
                                            By {assignment.teacherName} • {assignment.totalMarks} marks
                                        </p>
                                    </div>
                                    {assignment.dueDate && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-600">Due Date</p>
                                            <p className="text-amber-400 text-sm font-mono">
                                                {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {assignment.description}
                                    </p>
                                </div>

                                {assignment.hasAttachment && (
                                    <div className="mb-4 p-3 bg-slate-800/40 rounded-lg">
                                        <p className="text-slate-400 text-xs mb-1">Attachment</p>
                                        <p className="text-ink-400 text-sm">
                                            📎 {assignment.attachmentName}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                                    <div className="flex items-center gap-4">
                                        <span className="badge bg-ink-500/10 text-ink-400 border border-ink-500/20">
                                            📊 {assignment.totalMarks} marks
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            Created {assignment.createdAt?.toDate ?
                                                assignment.createdAt.toDate().toLocaleDateString() :
                                                'recently'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

// Class management component for teachers
function ClassManagement({ classId, cls }) {
    const [activeStudents, setActiveStudents] = useState([]);
    const [leftStudents, setLeftStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStudentData = async () => {
            setLoading(true);
            try {
                // Get active students
                const activeStudentIds = cls.studentIds || [];
                const activeStudentData = [];

                for (const studentId of activeStudentIds) {
                    try {
                        const studentDoc = await getDoc(doc(db, "users", studentId));
                        if (studentDoc.exists()) {
                            activeStudentData.push({
                                id: studentId,
                                ...studentDoc.data()
                            });
                        }
                    } catch (error) {
                        console.error("Error fetching student data:", error);
                    }
                }

                setActiveStudents(activeStudentData);
                setLeftStudents(cls.leftStudents || []);
            } catch (error) {
                console.error("Error loading student data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (cls) {
            loadStudentData();
        }
    }, [cls, classId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-32 rounded-xl" />
                <div className="skeleton h-32 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Students */}
            <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4">
                    Active Students ({activeStudents.length})
                </h3>

                {activeStudents.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-slate-400">No active students</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {activeStudents.map((student) => (
                            <div key={student.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-300">
                                    {student.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1">
                                    <p className="font-display font-medium text-white text-sm">
                                        {student.name || "Unknown Student"}
                                    </p>
                                    <p className="text-slate-500 text-xs">{student.email}</p>
                                </div>
                                <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                                    Active
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Students Who Left */}
            {leftStudents.length > 0 && (
                <div className="card p-6">
                    <h3 className="font-display font-bold text-white text-lg mb-4">
                        Students Who Left ({leftStudents.length})
                    </h3>

                    <div className="grid gap-3">
                        {leftStudents.map((student, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-sm font-bold text-red-300">
                                    {student.studentName?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1">
                                    <p className="font-display font-medium text-white text-sm">
                                        {student.studentName || "Unknown Student"}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        Left on {new Date(student.leftAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                                    Left
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Class Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="font-mono font-bold text-white text-xl">{activeStudents.length}</div>
                    <div className="text-slate-500 text-xs">Active Students</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">🚪</div>
                    <div className="font-mono font-bold text-white text-xl">{leftStudents.length}</div>
                    <div className="text-slate-500 text-xs">Students Left</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="font-mono font-bold text-white text-xl">
                        {activeStudents.length + leftStudents.length}
                    </div>
                    <div className="text-slate-500 text-xs">Total Enrolled</div>
                </div>
            </div>
        </div>
    );
}

// Simple analytics component for teachers
function ClassAnalytics({ classId }) {
    const [stats, setStats] = useState({
        totalSubmissions: 0,
        uniqueStudents: 0,
        averageFileSize: 0,
        fileTypes: {},
        submissionsByDay: []
    });

    useEffect(() => {
        // This would typically fetch analytics data from Firestore
        // For now, showing a placeholder
        setStats({
            totalSubmissions: 0,
            uniqueStudents: 0,
            averageFileSize: 0,
            fileTypes: {},
            submissionsByDay: []
        });
    }, [classId]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-6 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="font-mono font-bold text-white text-2xl">{stats.totalSubmissions}</div>
                    <div className="text-slate-500 text-sm">Total Submissions</div>
                </div>
                <div className="card p-6 text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="font-mono font-bold text-white text-2xl">{stats.uniqueStudents}</div>
                    <div className="text-slate-500 text-sm">Active Students</div>
                </div>
                <div className="card p-6 text-center">
                    <div className="text-3xl mb-2">💾</div>
                    <div className="font-mono font-bold text-white text-2xl">
                        {stats.averageFileSize.toFixed(1)}
                    </div>
                    <div className="text-slate-500 text-sm">Avg File Size (MB)</div>
                </div>
                <div className="card p-6 text-center">
                    <div className="text-3xl mb-2">📁</div>
                    <div className="font-mono font-bold text-white text-2xl">
                        {Object.keys(stats.fileTypes).length}
                    </div>
                    <div className="text-slate-500 text-sm">File Types</div>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="font-display font-bold text-white text-lg mb-4">Analytics Dashboard</h3>
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📈</div>
                    <p className="text-slate-400 font-display font-semibold">Analytics Coming Soon</p>
                    <p className="text-slate-600 text-sm mt-1">
                        Detailed submission analytics and insights will be available here.
                    </p>
                </div>
            </div>
        </div>
    );
}