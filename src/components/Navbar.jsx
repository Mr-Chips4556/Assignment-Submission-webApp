import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { currentUser, userProfile, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const homeLink = role === "teacher" ? "/teacher" : "/student";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to={homeLink} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-ink-600 flex items-center justify-center text-lg">
            📚
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            Edu<span className="text-ink-400">Submit</span>
          </span>
        </Link>

        {/* Right side */}
        {currentUser && (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span className={role === "teacher" ? "badge-teacher hidden sm:inline-flex" : "badge-student hidden sm:inline-flex"}>
              {role === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"}
            </span>

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-display font-semibold text-slate-200">
                {userProfile?.name ?? "User"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentUser.email}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-ink-700 border border-ink-500/40 flex items-center justify-center text-xs font-display font-bold text-ink-200">
              {(userProfile?.name ?? "U")[0].toUpperCase()}
            </div>

            {/* Logout */}
            <button onClick={handleLogout} className="btn-danger px-3 py-2 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
