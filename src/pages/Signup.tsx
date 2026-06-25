import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./AuthShell";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function submit() {
    setErr(null);
    if (password.length < 6) {
      setErr("Use at least 6 characters for your password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    // If email confirmation is off, a session exists now.
    const { data } = await supabase.auth.getSession();
    setBusy(false);
    if (data.session) {
      await refresh();
      navigate("/onboarding");
    } else {
      setErr("Check your inbox to confirm your email, then sign in.");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up a loyalty program in under two minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Momo"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shop.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="At least 6 characters"
          />
        </div>
        {err && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </p>
        )}
        <button onClick={submit} disabled={busy} className="btn-primary w-full">
          {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </AuthShell>
  );
}
