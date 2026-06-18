"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Lock, Mail, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);
    const result = await signup(username, email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Registration failed. Please try again.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-3xl -z-10 animate-pulse" style={{ animationDelay: "1.5s" }}></div>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-zinc-950/70 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-all duration-300">
              <Terminal className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-mono text-xl font-bold tracking-tight text-foreground">
              Dev<span className="text-cyan-400">Space</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold font-mono">Create Account</h2>
          <p className="text-zinc-500 text-xs mt-1">Get started with a free collaborative playground account</p>
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400/80" />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. janesmith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500/50 rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-650 transition-colors font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono flex items-center gap-1">
              <Mail className="w-3 h-3 text-cyan-400/80" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="jane.smith@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500/50 rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-650 transition-colors font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400/80" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500/50 rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-650 transition-colors font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-cyan-400 hover:bg-cyan-350 disabled:bg-zinc-800 font-mono font-bold text-xs text-zinc-950 disabled:text-zinc-600 transition-colors cursor-pointer mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Redirect CTA */}
        <div className="mt-8 pt-6 border-t border-zinc-900/80 text-center text-xs text-zinc-500 font-mono">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors">
            Login here
          </Link>
        </div>

      </div>
    </div>
  );
}
