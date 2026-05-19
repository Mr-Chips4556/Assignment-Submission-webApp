import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", user.uid), {
        name:      form.name.trim(),
        email:     form.email.trim(),
        role:      form.role,
        createdAt: serverTimestamp(),
      });
      navigate(form.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-ink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-600/20 border border-ink-500/30 mb-4 text-3xl">
            🎓
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Create account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join EduSubmit as a student or teacher</p>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {["student", "teacher"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all duration-200 font-display font-semibold text-sm
                  ${form.role === r
                    ? "border-ink-500 bg-ink-600/20 text-ink-300"
                    : "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                  }`}
              >
                <span className="text-2xl">{r === "student" ? "🎓" : "👨‍🏫"}</span>
                <span className="capitalize">{r}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-3"
            >
              {loading ? (
                <><Spinner /> Creating account…</>
              ) : (
                `Register as ${form.role === "teacher" ? "Teacher" : "Student"}`
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-ink-400 hover:text-ink-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
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

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already registered.";
    case "auth/invalid-email":        return "Please enter a valid email.";
    case "auth/weak-password":        return "Password is too weak (min 6 characters).";
    default:                          return "Registration failed. Please try again.";
  }
}
