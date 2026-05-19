import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
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
    const [activeTab, setActiveTab] = useState(role === "student" ? "upload" : "submissions");

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
            { id: "upload", label: "Submit Assignment", icon: "📤" },
            { id: "submissions", label: "My Submissions", icon: "📋" }
        ]
        : [
            { id: "submissions", label: "All Submissions", icon: "📋" },
            { id: "analytics", label: "Analytics", icon: "📊" }
        ];

    return (
        <div className="page-container">
            <Navbar />
            <div className="main-content">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate(-1)}
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
                            {activeTab === "upload" && <UploadAssignmentOptimized classId={classId} />}
                            {activeTab === "submissions" && <StudentSubmissionsEnhanced classId={classId} />}
                        </>
                    ) : (
                        <>
                            {activeTab === "submissions" && <TeacherSubmissionsEnhanced classId={classId} />}
                            {activeTab === "analytics" && <ClassAnalytics classId={classId} />}
                        </>
                    )}
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