"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Terminal, 
  Users, 
  MessageSquare, 
  Play, 
  MonitorSmartphone,
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
import { useAuth } from "@/context/AuthContext";

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
  const [toastMessage, setToastMessage] = useState("");
  const [theme, setTheme] = useState("dark");

  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    // Check initial class on documentElement
    const isLight = document.documentElement.classList.contains("light") || 
                    !document.documentElement.classList.contains("dark");
    setTimeout(() => setTheme(isLight ? "light" : "dark"), 0);
  }, []);

  useEffect(() => {
    if (user) {
      setRoomCreatorName(user.username);
      
      // Fetch user rooms
      setLoadingRooms(true);
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
      setUserRooms([]);
      setRoomCreatorName("");
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
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-zinc-900 border border-cyan-500/30 text-cyan-200 px-4 py-3 rounded-lg shadow-2xl animate-fade-in font-mono text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="w-full bg-banner-bg border-b border-card-border py-2.5 text-center text-[11px] sm:text-xs font-mono tracking-wide flex items-center justify-center gap-2 px-4 select-none">
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-cyan-400 text-zinc-950 text-[9px] font-bold uppercase mr-1 animate-pulse">New</span>
        <span>Introducing DevSpace v2.0 with instant peer connection.</span>
        <button 
          onClick={openModal}
          className="underline hover:text-cyan-300 font-bold transition-colors inline-flex items-center gap-0.5 cursor-pointer"
        >
          Try Now <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-card-border bg-header-bg backdrop-blur-xl transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-all duration-300">
              <Terminal className="h-4.5 w-4.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-lg bg-cyan-500/5 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-foreground group-hover:text-cyan-300 transition-colors">
              Dev<span className="text-cyan-400">Space</span>
            </span>
          </Link>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-text-muted">
            <Link href="#features" className="hover:text-foreground transition-colors py-1 relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full"></span>
            </Link>
            <Link href="#tech-stack" className="hover:text-foreground transition-colors py-1 relative group">
              Tech Stack
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full"></span>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors py-1 relative group">
              GitHub
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full"></span>
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-card-border bg-card-bg hover:bg-zinc-800/10 dark:hover:bg-zinc-800/15 transition-all text-text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-600" />
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right font-mono text-[10px]">
                  <span className="text-foreground font-bold">{user.username}</span>
                  <span className="text-zinc-500 truncate max-w-[100px]">{user.email}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-400 select-none uppercase font-mono">
                  {user.username.slice(0, 2)}
                </div>
                <button
                  onClick={logout}
                  className="h-8 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-3 rounded-lg text-[10px] font-mono font-bold text-zinc-400 hover:text-rose-455 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="h-8 inline-flex items-center rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-3 text-xs font-mono font-bold text-zinc-400 hover:text-foreground transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="h-8 inline-flex items-center rounded-lg bg-cyan-400 hover:bg-cyan-300 px-3 text-xs font-mono font-bold text-zinc-950 transition-all shadow-md shadow-cyan-400/10"
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] -z-10 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 blur-3xl opacity-60"></div>
          
          <div className="w-full min-w-0 max-w-[950px] space-y-6">
            
            {/* Inline announcement badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-card-border bg-card-bg text-xs font-mono text-text-muted hover:border-accent/30 transition-colors mx-auto select-none">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real-Time Code Sync Engine</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-mono text-foreground leading-[1.1]">
                Code Together. <br />
                <span className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Build Faster.
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-sm sm:text-base md:text-lg text-text-muted leading-relaxed px-2 font-sans">
                A real-time collaborative developer playground to write code, chat, and preview live output together.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button 
                onClick={openModal}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-cyan-400 px-8 text-sm font-mono font-bold text-zinc-955 shadow-xl shadow-cyan-400/10 hover:shadow-cyan-400/20 hover:bg-cyan-300 transition-all active:scale-98 w-full sm:w-auto cursor-pointer"
              >
                Try it Out <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <a 
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-card-border bg-card-bg hover:bg-card-bg/80 px-8 text-sm font-mono font-medium hover:text-foreground transition-all w-full sm:w-auto cursor-pointer"
              >
                View on GitHub
              </a>
            </div>
            
            {/* Visual Editor Mockup container */}
            <div id="editor-preview" className="pt-16 pb-4">
              <div className="text-xs font-mono text-zinc-500 mb-3 select-none flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>INTERACTIVE DEMO: Try sending a chat message on the right panel!</span>
              </div>
              
              {/* Floating shadow backdrop */}
              <div className="relative rounded-xl p-1 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur-xl -z-10 opacity-70"></div>
                <InteractiveEditor />
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-background border-y border-card-border bg-grid-pattern relative">
          
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none"></div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">Comprehensive Platform</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground font-mono sm:text-4xl">
                Everything you need to collaborate
              </p>
              <p className="mt-4 text-text-muted md:text-base max-w-[580px] mx-auto leading-relaxed">
                No installations. No configuration. Spin up a browser-based pair coding sandbox with real-time tooling.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              {/* Feature 1: Room Creation & Joining */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <Share2 className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Room Creation & Joining</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Spin up secure coding rooms instantly. Share the URL to invite developers to collaborate, zero setup required.
                </p>
              </div>

              {/* Feature 2: Real-Time Collaborative Editor */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <Code className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Real-Time Collaborative Editor</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Write code synchronously with multi-cursor support. Experience conflict-free editing powered by modern sync engines.
                </p>
              </div>

              {/* Feature 3: Live Chat */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Live Chat</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Discuss bugs, structural layout, and logic in real-time inside the shared room sidebar. Stay focused in one workspace.
                </p>
              </div>

              {/* Feature 4: Instant Code Preview (HTML/CSS/JS) */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <Play className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Instant Code Preview (HTML/CSS/JS)</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Watch HTML, CSS, and JavaScript compile and render instantly in a safe, sandboxed iframe right next to your editor.
                </p>
              </div>

              {/* Feature 5: Active Users Display */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Active Users Display</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Keep track of collaborators in the session with presence badges, active indicators, and colored remote cursors.
                </p>
              </div>

              {/* Feature 6: Fully Responsive UI */}
              <div className="group rounded-2xl border border-card-border bg-card-bg p-6 hover:border-accent/30 hover:bg-card-bg/85 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center mb-5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
                  <MonitorSmartphone className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-mono">Fully Responsive UI</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Code together from any device. The playground is fully optimized for fluid layout transitions on mobile, tablet, and desktop.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-24 bg-background relative">
          
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-20">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">Workflow Stream</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground font-mono sm:text-4xl">
                How it works
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto relative">
              
              {/* Connecting lines for large screens */}
              <div className="hidden md:block absolute top-12 left-16 right-16 h-0.5 bg-card-border -z-10"></div>
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4 group">
                <div className="w-16 h-16 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-lg font-bold font-mono text-cyan-400 group-hover:border-cyan-500/50 shadow-lg transition-all duration-300 relative">
                  01
                  <div className="absolute inset-0 rounded-2xl bg-cyan-500/2 opacity-0 group-hover:opacity-100 blur transition-all"></div>
                </div>
                <h3 className="text-base font-bold font-mono text-foreground pt-2">Create or join a room</h3>
                <p className="text-text-muted text-xs leading-relaxed max-w-[250px]">
                  Generate a custom playground room in one click and share the URL with your team.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4 group">
                <div className="w-16 h-16 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-lg font-bold font-mono text-cyan-400 group-hover:border-cyan-500/50 shadow-lg transition-all duration-300 relative">
                  02
                  <div className="absolute inset-0 rounded-2xl bg-cyan-500/2 opacity-0 group-hover:opacity-100 blur transition-all"></div>
                </div>
                <h3 className="text-base font-bold font-mono text-foreground pt-2">Code together in real time</h3>
                <p className="text-text-muted text-xs leading-relaxed max-w-[250px]">
                  Type synchronously with multi-cursor support. See changes live with zero latency.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4 group">
                <div className="w-16 h-16 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center text-lg font-bold font-mono text-cyan-400 group-hover:border-cyan-500/50 shadow-lg transition-all duration-300 relative">
                  03
                  <div className="absolute inset-0 rounded-2xl bg-cyan-500/2 opacity-0 group-hover:opacity-100 blur transition-all"></div>
                </div>
                <h3 className="text-base font-bold font-mono text-foreground pt-2">Chat and preview output live</h3>
                <p className="text-text-muted text-xs leading-relaxed max-w-[250px]">
                  Discuss bugs on the chat panel and watch your HTML/CSS/JS compile in the sandbox instantly.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Tech Stack Showcase */}
        <section id="tech-stack" className="w-full py-20 bg-background/20 border-y border-card-border bg-dot-pattern">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">Tech Stack Showcase</h2>
              <p className="mt-2 text-xl font-bold font-mono text-foreground">Engineered with robust open-source tools</p>
            </div>
            
            {/* Tech Chips Grid */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 max-w-4xl mx-auto">
              
              {/* Next.js */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-white/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-foreground">Next.js</span>
              </div>

              {/* Tailwind CSS */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-[#38bdf8]/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-[#38bdf8]">Tailwind CSS</span>
              </div>

              {/* Node.js */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-[#339933]/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#339933] animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-[#339933]">Node.js</span>
              </div>

              {/* Express */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-zinc-100/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-foreground">Express</span>
              </div>

              {/* Socket.io */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-[#010101]/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#010101] border border-zinc-700 animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-foreground">Socket.io</span>
              </div>

              {/* MongoDB */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-[#47a248]/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#47a248] animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-[#47a248]">MongoDB</span>
              </div>

              {/* Monaco Editor */}
              <div className="group px-4 py-2.5 rounded-xl border border-card-border bg-card-bg hover:border-[#007acc]/40 transition-colors duration-300 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#007acc] animate-pulse"></span>
                <span className="font-mono text-sm font-semibold text-text-muted group-hover:text-[#007acc]">Monaco Editor</span>
              </div>

            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-20">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">Why DevSpace?</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground font-mono sm:text-4xl">
                Streamline your development loop
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Benefit 1 */}
              <div className="flex gap-4 p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 hover:bg-card-bg/90 transition-colors duration-300">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-mono text-foreground">Faster team collaboration</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Instantly resolve bugs together instead of swapping static screenshots. Write mockups and interfaces collaboratively in minutes.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex gap-4 p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 hover:bg-card-bg/90 transition-colors duration-300">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-mono text-foreground">Live coding sessions</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Perfect for technical pair-interviews, coding education, remote workshops, and immediate developer peer review.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex gap-4 p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 hover:bg-card-bg/90 transition-colors duration-300">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-mono text-foreground">Easy project sharing</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Save work states, copy workspace invite links, or download static packages. Frictionless sharing with stakeholders.
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex gap-4 p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 hover:bg-card-bg/90 transition-colors duration-300">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-mono text-foreground">Developer-friendly workflow</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Equipped with Monaco editor syntax engines, instant Hot Module Reload terminal consoles, and active chat capabilities.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-24 bg-background/30 border-t border-card-border bg-grid-pattern relative">
          
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none"></div>

          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">Testimonials</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground font-mono sm:text-4xl">
                What developers are saying
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              {/* Testimonial 1 */}
              <div className="rounded-2xl border border-card-border bg-card-bg p-6 flex flex-col justify-between hover:border-accent/30 hover:bg-card-bg/90 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    ))}
                  </div>
                  <p className="text-text-muted text-sm italic leading-relaxed">
                    &quot;DevSpace has completely transformed our remote technical interviewing. We can pair code, chat, and see results instantly without sharing screens.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">SK</div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-foreground">Sarah K.</h4>
                    <span className="text-[10px] text-text-muted block">Lead Frontend Engineer, Vercel</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-2xl border border-card-border bg-card-bg p-6 flex flex-col justify-between hover:border-accent/30 hover:bg-card-bg/90 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    ))}
                  </div>
                  <p className="text-text-muted text-sm italic leading-relaxed">
                    &quot;As a student teaching web dev, DevSpace makes it so easy to review student code in real time. We spin up rooms in seconds and start hacking.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center font-bold text-xs text-white">MD</div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-foreground">Marcus D.</h4>
                    <span className="text-[10px] text-text-muted block">CS Instructor & Developer</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-2xl border border-card-border bg-card-bg p-6 flex flex-col justify-between hover:border-accent/30 hover:bg-card-bg/90 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    ))}
                  </div>
                  <p className="text-text-muted text-sm italic leading-relaxed">
                    &quot;It feels like Google Docs for code but with the speed and capabilities of VS Code. The Monaco editor integration is top-notch.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-card-border mt-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-zinc-955">LW</div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-foreground">Liam W.</h4>
                    <span className="text-[10px] text-text-muted block">Senior Dev, GitHub Contributor</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* User Dashboard Section */}
        {user && (
          <section id="dashboard" className="w-full py-16 border-t border-zinc-900 bg-zinc-950/40 relative z-10 font-mono">
            <div className="container mx-auto px-4 md:px-8 max-w-5xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    Your Developer Workspace
                  </h2>
                  <p className="text-xs text-text-muted">
                    Manage your persistent, real-time sync coding rooms.
                  </p>
                </div>
                
                <button
                  onClick={openModal}
                  className="h-10 inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 px-5 text-xs font-mono font-bold text-zinc-955 shadow-lg shadow-cyan-400/5 transition-all cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Room</span>
                </button>
              </div>

              {loadingRooms ? (
                <div className="p-16 border border-card-border rounded-2xl bg-zinc-955/30 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-xs text-text-muted">Fetching workspaces from MongoDB...</span>
                </div>
              ) : userRooms.length === 0 ? (
                <div className="p-16 border border-card-border/60 border-dashed rounded-2xl bg-zinc-950/20 text-center space-y-4">
                  <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                    You don&apos;t have any active developer rooms yet. Spin up a sandboxed workspace to start collaborating or writing code!
                  </p>
                  <button
                    onClick={openModal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg hover:bg-zinc-800/10 px-4 text-xs font-bold text-cyan-400 transition-all cursor-pointer"
                  >
                    Create a Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {userRooms.map((room) => {
                    const isPrivate = room.visibility === "private";
                    const isReadOnly = room.visibility === "readonly";
                    
                    return (
                      <div
                        key={room.roomId}
                        className="bg-zinc-900/40 border border-card-border rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-zinc-900/60 transition-all flex flex-col justify-between shadow-lg relative group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              {new Date(room.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              isPrivate 
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" 
                                : isReadOnly 
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                                : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                            }`}>
                              {room.visibility}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-cyan-300 transition-colors">
                              {room.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 select-text font-mono truncate">
                              ID: {room.roomId}
                            </p>
                          </div>
                        </div>

                        <div className="pt-5 flex items-center justify-between border-t border-zinc-800/20 mt-4">
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Persistent</span>
                          </span>
                          <Link
                            href={`/room/${room.roomId}?theme=${editorTheme}`}
                            className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 gap-0.5 hover:underline"
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
        <section className="w-full py-28 bg-background relative overflow-hidden bg-dot-pattern">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] -z-10 rounded-full bg-cyan-500/5 blur-3xl opacity-50"></div>
          
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-4xl mx-auto rounded-3xl border border-card-border bg-gradient-to-b from-card-bg to-card-bg/95 p-8 sm:p-12 lg:p-16 text-center shadow-2xl relative overflow-hidden">
              
              {/* Glow border details */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              
              <div className="space-y-6 max-w-xl mx-auto relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono sm:text-4xl">
                  Start Collaborating Today
                </h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed">
                  Join thousands of developers code sharing instantly. Spin up a room and invite your peers to program together now.
                </p>
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={openModal}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-cyan-400 px-8 text-sm font-mono font-bold text-zinc-955 shadow-xl shadow-cyan-400/20 hover:shadow-cyan-400/40 hover:bg-cyan-300 transition-all hover:scale-105 active:scale-98 cursor-pointer"
                  >
                    Try it Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-card-border bg-footer-bg relative z-10">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-card-bg border border-card-border flex items-center justify-center">
              <Terminal className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="font-mono text-base font-bold text-foreground">DevSpace</span>
          </div>
          <div className="flex flex-wrap items-center gap-8 text-xs font-mono text-text-muted">
            <a href="https://github.com" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="mailto:hello@devspace.io" className="hover:text-cyan-400 transition-colors">
              hello@devspace.io
            </a>
            <span>© {new Date().getFullYear()} DevSpace. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Room Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          
          {/* Modal box */}
          <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden relative backdrop-blur-2xl">
            
            {/* Top close button */}
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setModalStep("form");
                setRoomCreatorName("");
              }}
              className="absolute top-4 right-4 p-1 rounded-md text-text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step 1: Form */}
            {modalStep === "form" && (
              <form onSubmit={handleCreateRoom} className="p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground font-mono flex items-center gap-2">
                    <Plus className="w-5 h-5 text-cyan-400" />
                    <span>Create Session Room</span>
                  </h3>
                  <p className="text-text-muted text-xs">
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
                      className="w-full bg-background border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder-zinc-500 focus:outline-none transition-colors"
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
                      className="w-full bg-background border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {/* Room Visibility Options (Only if logged in) */}
                  {user && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block font-mono">Room Sharing Visibility</label>
                      <select 
                        value={roomVisibility} 
                        onChange={(e) => setRoomVisibility(e.target.value as any)}
                        className="w-full bg-background border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none transition-colors font-mono cursor-pointer"
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
                      className="w-full bg-background border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none transition-colors font-mono cursor-pointer"
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
                    className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-cyan-400 font-mono font-bold text-xs text-zinc-950 hover:bg-cyan-300 transition-colors cursor-pointer"
                  >
                    Generate Room Workspace
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Loading animation */}
            {modalStep === "loading" && (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-12 h-12">
                  <span className="absolute inset-0 rounded-full border-2 border-card-border"></span>
                  <span className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin"></span>
                </div>
                <div className="space-y-1 pt-2">
                  <h4 className="text-sm font-bold font-mono text-foreground">Initializing socket workspace...</h4>
                  <p className="text-[10px] text-text-muted font-mono">Syncing code buffers with Monaco Engine</p>
                </div>
              </div>
            )}

            {/* Step 3: Success state */}
            {modalStep === "success" && (
              <div className="p-6 sm:p-8 space-y-6 text-left">
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-mono">Workspace Created!</h3>
                  <p className="text-text-muted text-xs">
                    Your collaborative room is live and ready for coding.
                  </p>
                </div>

                <div className="space-y-4 font-mono">
                  
                  {/* Shareable Invite URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Invite Link</label>
                    <div className="flex gap-2 items-center bg-background rounded-lg p-1.5 border border-card-border">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="w-full bg-transparent px-2 text-xs text-cyan-500 dark:text-cyan-300 focus:outline-none selection:bg-cyan-500/30"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-1.5 hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 rounded-md text-text-muted hover:text-foreground transition-all cursor-pointer"
                        title="Copy Invite Link"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Room status indicators */}
                  <div className="p-3 rounded-lg border border-card-border bg-background/40 text-[11px] text-text-muted space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Creator:</span>
                      <span className="text-foreground font-semibold">{roomCreatorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Theme:</span>
                      <span className="text-foreground">{editorTheme}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
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
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-cyan-400 font-mono font-bold text-xs text-zinc-950 hover:bg-cyan-350 transition-colors cursor-pointer"
                  >
                    Enter Workspace
                  </button>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setModalStep("form");
                      setRoomCreatorName("");
                    }}
                    className="px-4 h-11 border border-card-border hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 transition-colors rounded-xl text-xs font-mono font-medium cursor-pointer"
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
