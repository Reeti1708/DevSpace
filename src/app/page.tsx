"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Play, 
  ChevronRight,
  Github,
  ArrowRight,
  Code,
  Share2,
  Laptop,
  CheckCircle2,
  Sparkles,
  Plus,
  Copy,
  Check,
  Zap,
  X,
  Star,
  Sun,
  Moon,
  Loader2
} from "lucide-react";
import InteractiveEditor from "@/components/InteractiveEditor";
import UpsideDownLoader from "@/components/UpsideDownLoader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

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

export default function Home() {
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const { user, logout, fetchWithAuth } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCreatorName, setRoomCreatorName] = useState("");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "readonly" | "private">("public");
  const [modalStep, setModalStep] = useState<"form" | "loading" | "success">("form");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState("dark");

  interface Room {
    roomId: string;
    name: string;
    visibility: "public" | "readonly" | "private";
    createdAt: string;
  }

  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    // Check initial class on documentElement
    const isLight = document.documentElement.classList.contains("light") || 
                    !document.documentElement.classList.contains("dark");
    setTimeout(() => setTheme(isLight ? "light" : "dark"), 0);
  }, []);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        setRoomCreatorName(user.username);
        setLoadingRooms(true);
      });
      
      // Fetch user rooms
      fetchWithAuth(`${BACKEND_URL}/api/rooms`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserRooms(data);
          }
          setLoadingRooms(false);
        })
        .catch(err => {
          console.error("Error fetching rooms:", err);
          setLoadingRooms(false);
        });
    } else {
      Promise.resolve().then(() => {
        setUserRooms([]);
        setRoomCreatorName("");
      });
    }
  }, [user, BACKEND_URL, fetchWithAuth]);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  };

  const openModal = () => {
    const descriptors = ["collaborative", "cyber", "neon", "sync", "hyper", "matrix", "vector", "cloud"];
    const nouns = ["playground", "sandbox", "station", "terminal", "matrix", "space", "hub", "node"];
    const randomName = `${descriptors[Math.floor(Math.random() * descriptors.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${Math.floor(Math.random() * 900) + 100}`;
    setRoomName(randomName);
    if (user) {
      setRoomCreatorName(user.username);
    }
    setIsModalOpen(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCreatorName.trim()) return;

    setModalStep("loading");
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomName, name: roomName, visibility: roomVisibility })
      });
      
      if (!response.ok) {
        throw new Error("Failed to initialize room session");
      }
      
      const data = await response.json();
      setGeneratedLink(`${window.location.origin}/room/${data.roomId}`);
      toast.success("Room created successfully!");
      setModalStep("success");

      // Refetch user rooms list if logged in
      if (user) {
        fetchWithAuth(`${BACKEND_URL}/api/rooms`)
          .then(res => res.json())
          .then(rooms => {
            if (Array.isArray(rooms)) setUserRooms(rooms);
          })
          .catch(err => console.error("Error refetching rooms:", err));
      }
    } catch (err) {
      console.error(err);
      showToast("Connection to backend server failed. Using local fallback.");
      setGeneratedLink(`${window.location.origin}/room/${roomName}`);
      setModalStep("success");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (message: string) => {
    if (message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-red-500/30 selection:text-red-200 relative">
      <FogParticles />

      {/* Top Banner */}
      <div className="w-full bg-banner-bg border-b border-card-border py-2.5 text-center text-[11px] sm:text-xs font-mono tracking-wide flex items-center justify-center gap-2 px-4 select-none relative z-10">
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-red-650 text-white text-[9px] font-bold uppercase mr-1 animate-pulse shadow-sm">New</span>
        <span>Introducing DevSpace v2.0 with instant peer connection.</span>
        <button 
          onClick={openModal}
          className="underline hover:text-red-400 font-bold transition-colors inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
        >
          Try Now <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-card-border/80 bg-header-bg backdrop-blur-xl transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-card-border/80 flex items-center justify-center group-hover:border-red-500/50 transition-all duration-300">
              <img 
                src="/logo.png" 
                alt="DevSpace Logo" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="font-stranger text-lg font-bold tracking-wider text-foreground group-hover:text-red-400 transition-colors uppercase">
              Dev<span className="text-red-655 glow-text-red">Space</span>
            </span>
          </Link>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-text-muted">
            <Link href="#features" className="hover:text-foreground transition-colors py-1 relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-655 transition-all group-hover:w-full"></span>
            </Link>
            <Link href="#tech-stack" className="hover:text-foreground transition-colors py-1 relative group">
              Tech Stack
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-655 transition-all group-hover:w-full"></span>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors py-1 relative group">
              GitHub
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-655 transition-all group-hover:w-full"></span>
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-card-border bg-card-bg hover:bg-zinc-850/15 dark:hover:bg-zinc-800/20 transition-all text-text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-650 dark:text-indigo-400" />
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right font-mono text-[10px]">
                  <span className="text-foreground font-bold">{user.username}</span>
                  <span className="text-zinc-500 truncate max-w-[100px]">{user.email}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-bold text-red-550 dark:text-red-400 select-none uppercase font-mono">
                  {user.username.slice(0, 2)}
                </div>
                <button
                  onClick={logout}
                  className="h-8 border border-zinc-800 hover:border-zinc-700 bg-zinc-955 dark:bg-zinc-950 px-3 rounded-lg text-[10px] font-mono font-bold text-zinc-400 hover:text-rose-455 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="h-8 inline-flex items-center rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-955 dark:bg-zinc-950 px-3 text-xs font-mono font-bold text-zinc-400 hover:text-foreground transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="h-8 inline-flex items-center rounded-lg bg-red-650 hover:bg-red-600 px-3 text-xs font-mono font-bold text-white transition-all shadow-md shadow-red-655/20 border border-red-700/50 glow-red"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">

        {/* Hero Section */}
        <section className="w-full py-20 lg:py-28 flex flex-col items-center justify-center text-center px-4 md:px-6 relative overflow-hidden bg-dot-pattern">
          
          {/* Radial gradient background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] -z-10 rounded-full bg-gradient-to-tr from-red-900/10 via-red-955/5 to-slate-955/20 blur-3xl opacity-80"></div>
          
          <div className="w-full min-w-0 max-w-[950px] space-y-6">
            
            {/* Inline announcement badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-card-border bg-card-bg text-xs font-mono text-text-muted hover:border-red-500/30 transition-colors mx-auto select-none">
              <Sparkles className="w-3.5 h-3.5 text-red-550 dark:text-red-400 animate-pulse" />
              <span>Real-Time Code Sync Engine</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-wider sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.15] max-w-4xl mx-auto font-stranger uppercase">
                Code Together <br className="hidden sm:inline" />
                <span className="animate-flicker block sm:inline text-red-655 glow-text-red">
                  in Real Time
                </span>
              </h1>
              <p className="mx-auto max-w-[750px] text-base sm:text-lg md:text-xl text-text-muted leading-relaxed px-4 font-retro-serif font-normal">
                An ultra-responsive collaborative workspace for remote pair programming. Write code, chat with peers, and preview sandbox output instantly in one unified window.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button 
                onClick={openModal}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-red-650 hover:bg-red-600 px-8 text-sm font-mono font-bold text-white shadow-xl shadow-red-655/15 hover:shadow-red-600/35 transition-all active:scale-98 w-full sm:w-auto cursor-pointer border border-red-700/50 glow-red"
              >
                Try it Out <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <a 
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-card-border bg-card-bg hover:bg-card-bg/85 px-8 text-sm font-mono font-medium hover:text-foreground hover:border-red-500/40 transition-all w-full sm:w-auto cursor-pointer"
              >
                View on GitHub
              </a>
            </div>
            
            {/* Visual Editor Mockup container */}
            <div id="editor-preview" className="pt-20 pb-4 w-full max-w-5xl mx-auto">
              <div className="text-xs font-retro-serif text-red-500 dark:text-red-400 mb-4 select-none flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-550"></span>
                </span>
                <span>INTERACTIVE DEMO: Try editing or typing in the chat!</span>
              </div>
              
              {/* macOS Window Frame */}
              <div className="relative rounded-2xl border border-red-955/40 bg-zinc-900 shadow-[0_0_50px_-12px_rgba(229,9,20,0.25)] overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-955 border-b border-zinc-900/60 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono">
                    <Code className="w-3 h-3 text-red-550/60" />
                    <span>devspace-sandbox / index.html</span>
                  </div>
                  <div className="w-12"></div> {/* Spacer for symmetry */}
                </div>
                <InteractiveEditor />
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-28 bg-background border-y border-card-border relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
          {/* Radial gradient background behind features */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] -z-10 rounded-full bg-gradient-to-tr from-red-950/10 to-slate-955/20 blur-3xl opacity-50"></div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs uppercase tracking-widest text-red-500 dark:text-red-400 font-mono font-bold px-3 py-1 rounded-full bg-red-950/20 border border-red-950/30">
                FEATURES
              </span>
              <h2 className="text-3xl font-extrabold tracking-wider text-foreground font-stranger sm:text-4xl uppercase">
                Collaborative coding, reimagined.
              </h2>
              <p className="text-text-muted md:text-lg max-w-[620px] mx-auto leading-relaxed font-retro-serif">
                DevSpace packs powerful features to keep your team connected, coding, and deploying simultaneously.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Feature 1: Real-time editing */}
              <div className="group relative rounded-2xl border border-card-border bg-card-bg/60 p-8 backdrop-blur-sm hover:border-red-500/40 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                <div className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-6 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-all duration-300">
                  <Code className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-stranger tracking-wide uppercase">Real-time editing</h3>
                <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                  Write and debug code synchronously with multi-cursor support. Experience conflict-free editing powered by modern sync engines, rendering updates instantly for everyone.
                </p>
              </div>

              {/* Feature 2: Live chat */}
              <div className="group relative rounded-2xl border border-card-border bg-card-bg/60 p-8 backdrop-blur-sm hover:border-red-500/40 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                <div className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-6 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-all duration-300">
                  <MessageSquare className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-stranger tracking-wide uppercase">Live chat</h3>
                <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                  Discuss bugs, page layouts, and software architectures in real-time in the sidebar chat. Never context-switch to external communication tools again.
                </p>
              </div>

              {/* Feature 3: Instant preview */}
              <div className="group relative rounded-2xl border border-card-border bg-card-bg/60 p-8 backdrop-blur-sm hover:border-red-500/40 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                <div className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-6 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-all duration-300">
                  <Play className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-stranger tracking-wide uppercase">Instant preview</h3>
                <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                  Watch your HTML, CSS, and JavaScript run instantly in a sandboxed iframe right alongside your editor. Get immediate visual feedback on code changes.
                </p>
              </div>

              {/* Feature 4: Multi-user rooms */}
              <div className="group relative rounded-2xl border border-card-border bg-card-bg/60 p-8 backdrop-blur-sm hover:border-red-500/40 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                <div className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-6 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-all duration-300">
                  <Users className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-stranger tracking-wide uppercase">Multi-user rooms</h3>
                <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                  Create rooms instantly with customizable permissions. Invite team members with a secure, copyable link, and see live presence badges and remote cursors.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-28 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="text-center mb-20 space-y-4">
              <span className="text-xs uppercase tracking-widest text-red-500 dark:text-red-400 font-mono font-bold px-3 py-1 rounded-full bg-red-950/20 border border-red-950/30">
                WORKFLOW
              </span>
              <h2 className="text-3xl font-extrabold tracking-wider text-foreground font-stranger sm:text-4xl uppercase">
                Get started in seconds
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full relative">
              {/* Connecting line between steps on desktop */}
              <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-red-500/5 via-red-500/25 to-red-500/5 -z-10"></div>
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-5 group">
                <div className="w-20 h-20 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-xl font-bold font-mono text-red-500 dark:text-red-400 group-hover:border-red-500/40 group-hover:scale-105 shadow-md shadow-zinc-950/5 transition-all duration-300 relative">
                  01
                  <div className="absolute inset-0 rounded-2xl bg-red-500/5 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Create a Room</h3>
                <p className="text-text-muted text-sm leading-relaxed max-w-[280px] font-retro-serif">
                  Generate a custom playground room in one click and configure permissions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-5 group">
                <div className="w-20 h-20 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-xl font-bold font-mono text-red-500 dark:text-red-400 group-hover:border-red-500/40 group-hover:scale-105 shadow-md shadow-zinc-950/5 transition-all duration-300 relative">
                  02
                  <div className="absolute inset-0 rounded-2xl bg-red-500/5 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Invite Collaborators</h3>
                <p className="text-text-muted text-sm leading-relaxed max-w-[280px] font-retro-serif">
                  Share the secure URL with your team. They can join instantly with zero setup.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-5 group">
                <div className="w-20 h-20 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-xl font-bold font-mono text-red-500 dark:text-red-400 group-hover:border-red-500/40 group-hover:scale-105 shadow-md shadow-zinc-950/5 transition-all duration-300 relative">
                  03
                  <div className="absolute inset-0 rounded-2xl bg-red-500/5 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Code & Preview Live</h3>
                <p className="text-text-muted text-sm leading-relaxed max-w-[280px] font-retro-serif">
                  Write code synchronously, chat on the panel, and see results render in the sandbox.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Tech Stack Showcase */}
        <section id="tech-stack" className="w-full py-20 bg-background/40 border-y border-card-border bg-dot-pattern">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl">
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs uppercase tracking-widest text-red-500 dark:text-red-400 font-mono font-bold">
                ENGINEERING
              </span>
              <p className="text-2xl font-bold font-retro-serif text-foreground">Engineered with modern, open-source technology</p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 max-w-3xl mx-auto font-mono text-sm">
              
              {/* Next.js */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-zinc-550 dark:hover:border-zinc-750 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-foreground animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-foreground">Next.js</span>
              </div>

              {/* Tailwind CSS */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-[#38bdf8]/40 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-[#38bdf8]">Tailwind CSS</span>
              </div>

              {/* Node.js */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-[#339933]/40 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#339933] animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-[#339933]">Node.js</span>
              </div>

              {/* Express */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-zinc-500/40 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-foreground">Express</span>
              </div>

              {/* Socket.io */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-zinc-800 dark:hover:border-zinc-300 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-300 animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-foreground">Socket.io</span>
              </div>

              {/* MongoDB */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-[#47a248]/40 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#47a248] animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-[#47a248]">MongoDB</span>
              </div>

              {/* Monaco Editor */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg/60 hover:border-[#007acc]/40 transition-all duration-300 flex items-center gap-2 select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#007acc] animate-pulse"></span>
                <span className="font-semibold text-text-muted group-hover:text-[#007acc]">Monaco Editor</span>
              </div>

            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-28 bg-background">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="text-center mb-20 space-y-4">
              <span className="text-xs uppercase tracking-widest text-red-500 dark:text-red-400 font-mono font-bold px-3 py-1 rounded-full bg-red-950/20 border border-red-950/30">
                BENEFITS
              </span>
              <h2 className="text-3xl font-extrabold tracking-wider text-foreground font-stranger sm:text-4xl uppercase">
                Streamline your development loop
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Benefit 1 */}
              <div className="flex gap-5 p-6 rounded-2xl border border-card-border bg-card-bg/60 hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Faster team collaboration</h3>
                  <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                    Instantly resolve bugs together instead of swapping static screenshots. Write mockups and interfaces collaboratively in minutes.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex gap-5 p-6 rounded-2xl border border-card-border bg-card-bg/60 hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Live coding sessions</h3>
                  <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                    Perfect for technical pair-interviews, coding education, remote workshops, and immediate developer peer review.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex gap-5 p-6 rounded-2xl border border-card-border bg-card-bg/60 hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Easy project sharing</h3>
                  <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                    Save work states, copy workspace invite links, or download static packages. Frictionless sharing with stakeholders.
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex gap-5 p-6 rounded-2xl border border-card-border bg-card-bg/60 hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-stranger text-foreground tracking-wide uppercase">Developer-friendly workflow</h3>
                  <p className="text-text-muted text-sm leading-relaxed font-retro-serif">
                    Equipped with Monaco editor syntax engines, instant Hot Module Reload terminal consoles, and active chat capabilities.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-28 bg-background/30 border-t border-card-border bg-grid-pattern relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none"></div>

          <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-6xl">
            <div className="text-center mb-20 space-y-4">
              <span className="text-xs uppercase tracking-widest text-red-500 dark:text-red-400 font-mono font-bold px-3 py-1 rounded-full bg-red-950/20 border border-red-950/30">
                REVIEWS
              </span>
              <h2 className="text-3xl font-extrabold tracking-wider text-foreground font-stranger sm:text-4xl uppercase font-black">
                What developers are saying
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              {/* Testimonial 1 */}
              <div className="rounded-2xl border border-card-border bg-card-bg/60 p-6 flex flex-col justify-between hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.15)]">
                <div className="space-y-4 font-retro-serif text-sm">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
                    ))}
                  </div>
                  <p className="text-text-muted italic leading-relaxed">
                    &quot;DevSpace has completely transformed our remote technical interviewing. We can pair code, chat, and see results instantly without sharing screens.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-650 to-red-955 flex items-center justify-center font-bold text-xs text-white">SK</div>
                  <div>
                    <h4 className="text-xs font-bold font-stranger text-foreground tracking-wide uppercase">Sarah K.</h4>
                    <span className="text-[10px] text-text-muted block">Lead Frontend Engineer, Vercel</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-2xl border border-card-border bg-card-bg/60 p-6 flex flex-col justify-between hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.15)]">
                <div className="space-y-4 font-retro-serif text-sm">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
                    ))}
                  </div>
                  <p className="text-text-muted italic leading-relaxed font-sans">
                    &quot;As a student teaching web dev, DevSpace makes it so easy to review student code in real time. We spin up rooms in seconds and start hacking.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-655 to-red-955 flex items-center justify-center font-bold text-xs text-white">MD</div>
                  <div>
                    <h4 className="text-xs font-bold font-stranger text-foreground tracking-wide uppercase">Marcus D.</h4>
                    <span className="text-[10px] text-text-muted block">CS Instructor & Developer</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-2xl border border-card-border bg-card-bg/60 p-6 flex flex-col justify-between hover:border-red-500/30 hover:bg-card-bg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(229,9,20,0.15)]">
                <div className="space-y-4 font-retro-serif text-sm">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
                    ))}
                  </div>
                  <p className="text-text-muted italic leading-relaxed">
                    &quot;It feels like Google Docs for code but with the speed and capabilities of VS Code. The Monaco editor integration is top-notch.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-650 to-red-950 flex items-center justify-center font-bold text-xs text-white">LW</div>
                  <div>
                    <h4 className="text-xs font-bold font-stranger text-foreground tracking-wide uppercase font-black font-mono">Liam W.</h4>
                    <span className="text-[10px] text-text-muted block">Senior Dev, GitHub Contributor</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* User Dashboard Section */}
        {user && (
          <section id="dashboard" className="w-full py-20 border-t border-card-border bg-zinc-955/20 dark:bg-zinc-955/40 relative z-10 font-retro-serif">
            <div className="container mx-auto px-4 md:px-8 max-w-5xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-wider text-foreground font-stranger uppercase">
                    Your Developer Workspace
                  </h2>
                  <p className="text-sm text-text-muted">
                    Manage your persistent, real-time sync coding rooms.
                  </p>
                </div>
                
                <button
                  onClick={openModal}
                  className="h-10 inline-flex items-center gap-1.5 rounded-xl bg-red-650 hover:bg-red-600 px-5 text-xs font-mono font-bold text-white shadow-lg shadow-red-650/10 hover:shadow-red-600/30 transition-all cursor-pointer select-none border border-red-700/50 glow-red"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Room</span>
                </button>
              </div>

              {loadingRooms ? (
                <div className="p-20 border border-card-border rounded-2xl bg-card-bg/40 flex flex-col items-center justify-center gap-4 shadow-sm">
                  <Loader2 className="w-8 h-8 text-red-655 animate-spin" />
                  <span className="text-xs font-mono text-text-muted">Fetching workspaces from MongoDB...</span>
                </div>
              ) : userRooms.length === 0 ? (
                <div className="p-20 border border-card-border border-dashed rounded-2xl bg-card-bg/25 text-center space-y-4 shadow-sm">
                  <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                    You don&apos;t have any active developer rooms yet. Spin up a sandboxed workspace to start collaborating or writing code!
                  </p>
                  <button
                    onClick={openModal}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-card-border bg-card-bg hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 px-5 text-xs font-bold text-red-550 dark:text-red-400 transition-all cursor-pointer"
                  >
                    Create a Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userRooms.map((room) => {
                    const isPrivate = room.visibility === "private";
                    const isReadOnly = room.visibility === "readonly";
                    
                    return (
                      <div
                        key={room.roomId}
                        className="bg-card-bg/50 border border-card-border rounded-2xl p-6 hover:border-red-500/35 hover:bg-card-bg transition-all flex flex-col justify-between shadow-sm relative group hover:shadow-[0_0_15px_rgba(229,9,20,0.15)]"
                      >
                        <div className="space-y-4 font-retro-serif">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                              {new Date(room.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              isPrivate 
                                ? "bg-rose-500/10 text-rose-550 dark:text-rose-455 border border-rose-500/20" 
                                : isReadOnly 
                                ? "bg-amber-500/10 text-amber-550 dark:text-amber-455 border border-amber-500/20" 
                                : "bg-red-500/10 text-red-550 dark:text-red-400 border border-red-500/20"
                            }`}>
                              {room.visibility}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-bold text-base text-foreground truncate group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                              {room.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 select-text font-mono truncate">
                              ID: {room.roomId}
                            </p>
                          </div>
                        </div>

                        <div className="pt-5 flex items-center justify-between border-t border-card-border mt-5 font-retro-serif">
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-mono">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Persistent</span>
                          </span>
                          <Link
                            href={`/room/${room.roomId}?theme=${editorTheme}`}
                            className="inline-flex items-center text-xs font-bold text-red-550 dark:text-red-450 hover:underline gap-0.5"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Call To Action Section */}
        <section className="w-full py-28 bg-background relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] -z-10 rounded-full bg-gradient-to-tr from-red-955/10 to-slate-955/20 blur-3xl opacity-30"></div>
          
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="rounded-3xl border border-card-border bg-gradient-to-b from-card-bg to-card-bg/95 p-10 sm:p-16 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
              
              <div className="space-y-6 max-w-xl mx-auto relative z-10">
                <h2 className="text-3xl font-extrabold tracking-wider text-foreground font-stranger sm:text-4xl uppercase">
                  Start collaborating today
                </h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed font-retro-serif">
                  Join thousands of developers code sharing instantly. Spin up a sandboxed room and invite your peers to program together now.
                </p>
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={openModal}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-red-650 hover:bg-red-600 px-8 text-sm font-mono font-bold text-white shadow-md shadow-red-655/10 hover:shadow-red-600/30 hover:scale-98 transition-all cursor-pointer border border-red-700/50 glow-red"
                  >
                    Try it Out <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-card-border bg-footer-bg relative z-10 font-mono text-xs text-text-muted">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md overflow-hidden border border-card-border flex items-center justify-center bg-card-bg">
              <img 
                src="/logo.png" 
                alt="DevSpace Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-base font-bold text-foreground font-stranger uppercase">DevSpace</span>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <a href="https://github.com" className="hover:text-red-400 transition-colors flex items-center gap-1.5" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="mailto:hello@devspace.io" className="hover:text-red-400 transition-colors">
              hello@devspace.io
            </a>
            <span>© {new Date().getFullYear()} DevSpace. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Room Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-md animate-fade-in">
          
          {/* Modal box */}
          <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden relative backdrop-blur-2xl">
            
            {/* Top close button */}
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setModalStep("form");
                setRoomCreatorName("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 transition-all cursor-pointer border-none bg-transparent"
              title="Close Modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Step 1: Form */}
            {modalStep === "form" && (
              <form onSubmit={handleCreateRoom} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground font-stranger tracking-wide uppercase flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-555" />
                    <span>Create Session Room</span>
                  </h3>
                  <p className="text-text-muted text-xs font-retro-serif">
                    Configure your sandboxed room and connect instantly.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Your Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block font-mono">Your Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Alex Henderson"
                      value={roomCreatorName}
                      onChange={(e) => setRoomCreatorName(e.target.value)}
                      className="w-full bg-background border border-card-border focus:border-red-500/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-retro-serif"
                    />
                  </div>

                  {/* Room Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block font-mono">Room ID / Workspace Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. cyber-playground"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                      className="w-full bg-background border border-card-border focus:border-red-500/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Room Visibility Options (Only if logged in) */}
                  {user && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block font-mono">Room Sharing Visibility</label>
                      <select 
                        value={roomVisibility} 
                        onChange={(e) => setRoomVisibility(e.target.value as "public" | "readonly" | "private")}
                        className="w-full bg-background border border-card-border focus:border-red-500/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-mono cursor-pointer"
                      >
                        <option value="public">Public (Collaborative Sync)</option>
                        <option value="readonly">Public Read-Only (Peers can only view)</option>
                        <option value="private">Private (Only you can access)</option>
                      </select>
                    </div>
                  )}

                  {/* Editor Theme Option */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block font-mono">Default Theme</label>
                    <select 
                      value={editorTheme} 
                      onChange={(e) => setEditorTheme(e.target.value)}
                      className="w-full bg-background border border-card-border focus:border-red-500/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-mono cursor-pointer"
                    >
                      <option value="vs-dark">VS Dark (Default)</option>
                      <option value="monokai">Monokai Retro</option>
                      <option value="dracula">Dracula Goth</option>
                      <option value="light">Monaco Classic Light</option>
                    </select>
                  </div>

                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-red-650 hover:bg-red-600 font-mono font-bold text-xs text-white transition-all cursor-pointer shadow-md shadow-red-655/10 border border-red-700/50 glow-red"
                  >
                    Generate Room Workspace
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Loading animation */}
            {modalStep === "loading" && (
              <UpsideDownLoader />
            )}

            {/* Step 3: Success state */}
            {modalStep === "success" && (
              <div className="p-6 sm:p-8 space-y-6 text-left">
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <Check className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-stranger tracking-wide uppercase">Workspace Created!</h3>
                  <p className="text-text-muted text-xs font-retro-serif">
                    Your collaborative room is live and ready for coding.
                  </p>
                </div>

                <div className="space-y-4 font-mono font-semibold">
                  
                  {/* Shareable Invite URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Invite Link</label>
                    <div className="flex gap-2 items-center bg-background rounded-lg p-1.5 border border-card-border">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="w-full bg-transparent px-2 text-xs text-red-550 dark:text-red-400 focus:outline-none selection:bg-red-500/30 font-semibold"
                      />
                      <button
                        onClick={handleCopyLink}
                        type="button"
                        className="p-1.5 hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 rounded-md text-text-muted hover:text-foreground transition-all cursor-pointer"
                        title="Copy Invite Link"
                      >
                        {copied ? <Check className="w-4.5 h-4.5 text-emerald-550 dark:text-emerald-450" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Room status indicators */}
                  <div className="p-3 rounded-lg border border-card-border bg-background/40 text-[11px] text-text-muted space-y-2">
                    <div className="flex items-center justify-between font-medium">
                      <span>Creator:</span>
                      <span className="text-foreground font-semibold">{roomCreatorName}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span>Theme:</span>
                      <span className="text-foreground font-semibold">{editorTheme}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span>Status:</span>
                      <span className="text-emerald-500 dark:text-emerald-450 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        READY
                      </span>
                    </div>
                  </div>

                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setModalStep("form");
                      const creator = roomCreatorName;
                      setRoomCreatorName("");
                      router.push(`/room/${roomName}?username=${encodeURIComponent(creator)}&theme=${editorTheme}`);
                    }}
                    type="button"
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-red-650 font-mono font-bold text-xs text-white hover:bg-red-600 hover:scale-98 transition-all cursor-pointer shadow-md shadow-red-655/10 border border-red-700/50 glow-red"
                  >
                    Enter Workspace
                  </button>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setModalStep("form");
                      setRoomCreatorName("");
                    }}
                    type="button"
                    className="px-4 h-11 border border-card-border hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 transition-all rounded-xl text-xs font-mono font-medium cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
