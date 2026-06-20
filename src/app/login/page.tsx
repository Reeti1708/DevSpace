"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

// Pure CSS floating ash particles layer
function FogParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div className="ash-particle ash-1"></div>
      <div className="ash-particle ash-2"></div>
      <div className="ash-particle ash-3"></div>
      <div className="ash-particle ash-4"></div>
      <div className="ash-particle ash-5"></div>
      <div className="ash-particle ash-6"></div>
      <div className="ash-particle ash-7"></div>
      <div className="ash-particle ash-8"></div>
      <div className="ash-particle ash-9"></div>
      <div className="ash-particle ash-10"></div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Invalid credentials. Please try again.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex items-center justify-center p-4 relative overflow-hidden select-none font-retro-serif">
      <FogParticles />
      
      {/* Dynamic Background Gradients - Deep cold blue & dark red */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-red-950/10 blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-950/10 blur-3xl -z-10 animate-pulse" style={{ animationDelay: "1.5s" }}></div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-955/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative glow-red">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-955/20 border border-red-500/30 flex items-center justify-center group-hover:border-red-500/50 transition-all duration-300 glow-red">
              <Terminal className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform glow-text-red" />
            </div>
            <span className="font-stranger text-2xl font-bold tracking-wider text-red-500 glow-text-red">
              DEVSPACE
            </span>
          </Link>
          <h2 className="text-xl font-bold font-stranger uppercase tracking-wider text-zinc-300">Welcome Back</h2>
          <p className="text-zinc-500 text-xs mt-1 font-retro-serif">Sign in to access your saved collaborative playgrounds</p>
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 glow-text-red" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-retro-serif flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/60 border border-red-955/20 focus:border-red-500/50 rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-650 transition-colors font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-retro-serif flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span>Password</span>
              </label>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/60 border border-red-955/20 focus:border-red-500/50 rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-650 transition-colors font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-red-955 hover:bg-red-900 disabled:bg-zinc-900 font-stranger tracking-wider uppercase text-xs text-white disabled:text-zinc-600 transition-colors cursor-pointer mt-4 glow-red border border-red-500/30"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Redirect CTA */}
        <div className="mt-8 pt-6 border-t border-zinc-900/80 text-center text-xs text-zinc-500 font-retro-serif relative z-10">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-red-500 hover:text-red-400 underline font-bold transition-colors">
            Register for free
          </Link>
        </div>

      </div>
    </div>
  );
}
