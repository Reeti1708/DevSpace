"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal as TerminalIcon, 
  Users, 
  MessageSquare, 
  Play, 
  Send, 
  FileCode, 
  FolderTree, 
  Settings,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "You" | "Alex" | "Sarah";
  text: string;
  time: string;
  avatarColor: string;
}

export default function InteractiveEditor() {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [mobileTab, setMobileTab] = useState<"code" | "preview" | "chat">("code");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "Alex",
      text: "Hey! Just joined the room. Let's build that glowing clock interface.",
      time: "17:34",
      avatarColor: "bg-purple-500",
    },
    {
      id: "2",
      sender: "Sarah",
      text: "Looks cool. I'll add the background particle styling in styles.css.",
      time: "17:35",
      avatarColor: "bg-pink-500",
    },
  ]);
  
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "[DevSpace Server] Initializing web sandbox...",
    "[DevSpace Server] Hot module reloading active.",
    "[DevSpace Server] Server listening on http://localhost:3000",
  ]);

  const [simulatedCodeLine, setSimulatedCodeLine] = useState("");
  const [timeString, setTimeString] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live ticking clock for preview
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Simulate remote typing changes over time
  useEffect(() => {
    let index = 0;
    const codeToAdd = "  console.log('Clock rendered successfully!');";
    
    const typingTimeout = setTimeout(() => {
      setIsTyping(true);
      
      const charInterval = setInterval(() => {
        if (index < codeToAdd.length) {
          setSimulatedCodeLine((prev) => prev + codeToAdd[index]);
          index++;
        } else {
          clearInterval(charInterval);
          setIsTyping(false);
          // Append output to terminal
          setTerminalLines((prev) => [
            ...prev,
            `[DevSpace Compiler] app.js compiled successfully.`,
            `[DevSpace Runtime] console.log: "Clock rendered successfully!"`
          ]);
        }
      }, 80);

      return () => clearInterval(charInterval);
    }, 5000);

    return () => clearTimeout(typingTimeout);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarColor: "bg-cyan-500",
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage("");

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replies = [
          "Nice! That works perfectly.",
          "Awesome. I see the live preview updated on my side too.",
          "Let's add a gradient border to the preview next.",
          "This real-time sync is blazing fast!"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: Math.random() > 0.5 ? "Sarah" : "Alex",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarColor: Math.random() > 0.5 ? "bg-pink-500" : "bg-purple-500",
        };
        setChatMessages((prev) => [...prev, replyMsg]);
      }, 1500);
    }, 1000);
  };

  const codeSnippets = {
    html: [
      { text: '<!DOCTYPE html>', color: 'text-gray-500' },
      { text: '<html lang="en">', color: 'text-blue-400' },
      { text: '<head>', color: 'text-blue-400' },
      { text: '  <link rel="stylesheet" href="styles.css">', color: 'text-cyan-400' },
      { text: '</head>', color: 'text-blue-400' },
      { text: '<body>', color: 'text-blue-400' },
      { text: '  <div class="card">', color: 'text-blue-400' },
      { text: '    <div class="glow"></div>', color: 'text-blue-400' },
      { text: '    <div class="content">', color: 'text-blue-400' },
      { text: '      <h3>DevSpace Clock</h3>', color: 'text-slate-100' },
      { text: '      <div id="timer" class="time">00:00:00</div>', color: 'text-orange-400' },
      { text: '      <p>Real-Time Collaboration</p>', color: 'text-slate-100' },
      { text: '    </div>', color: 'text-blue-400' },
      { text: '  </div>', color: 'text-blue-400' },
      { text: '  <script src="app.js"></script>', color: 'text-cyan-400' },
      { text: '</body>', color: 'text-blue-400' },
      { text: '</html>', color: 'text-blue-400' }
    ],
    css: [
      { text: 'body {', color: 'text-purple-400' },
      { text: '  background: #09090b;', color: 'text-cyan-300' },
      { text: '  color: #ffffff;', color: 'text-cyan-300' },
      { text: '  display: flex;', color: 'text-cyan-300' },
      { text: '  justify-content: center;', color: 'text-cyan-300' },
      { text: '  align-items: center;', color: 'text-cyan-300' },
      { text: '}', color: 'text-purple-400' },
      { text: '', color: '' },
      { text: '.card {', color: 'text-purple-400' },
      { text: '  position: relative;', color: 'text-cyan-300' },
      { text: '  background: rgba(30, 30, 40, 0.6);', color: 'text-cyan-300' },
      { text: '  border: 1px solid #00f0ff;', color: 'text-cyan-300' },
      { text: '  border-radius: 16px;', color: 'text-cyan-300' },
      { text: '  padding: 24px;', color: 'text-cyan-300' },
      { text: '  backdrop-filter: blur(12px);', color: 'text-cyan-300' },
      { text: '}', color: 'text-purple-400' },
      { text: '', color: '' },
      { text: '.time {', color: 'text-purple-400' },
      { text: '  font-size: 2rem;', color: 'text-cyan-300' },
      { text: '  font-weight: 700;', color: 'text-cyan-300' },
      { text: '  color: #00f0ff;', color: 'text-cyan-300' },
      { text: '  text-shadow: 0 0 10px rgba(0,240,255,0.5);', color: 'text-cyan-300' },
      { text: '}', color: 'text-purple-400' }
    ],
    js: [
      { text: 'function startClock() {', color: 'text-yellow-400' },
      { text: '  const timeEl = document.getElementById("timer");', color: 'text-pink-400' },
      { text: '  if (!timeEl) return;', color: 'text-pink-400' },
      { text: '  ', color: '' },
      { text: '  setInterval(() => {', color: 'text-yellow-400' },
      { text: '    const now = new Date();', color: 'text-pink-400' },
      { text: '    const timeStr = now.toLocaleTimeString();', color: 'text-pink-400' },
      { text: '    timeEl.innerText = timeStr;', color: 'text-pink-400' },
      { text: '  }, 1000);', color: 'text-yellow-400' },
      { text: '}', color: 'text-yellow-400' },
      { text: 'startClock();', color: 'text-cyan-400' },
      { text: '', color: '' }
    ]
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-zinc-800 bg-zinc-950/70 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col h-[580px] text-left">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/90 select-none">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></div>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span className="text-zinc-600 font-semibold">workspace /</span>
            <span>clock-widget</span>
          </div>
        </div>

        {/* Presence badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5 mr-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500 border border-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-950 shadow-sm" title="You">Y</div>
            <div className="w-6 h-6 rounded-full bg-purple-500 border border-zinc-950 flex items-center justify-center text-[9px] font-bold text-white shadow-sm animate-pulse" title="Alex">A</div>
            <div className="w-6 h-6 rounded-full bg-pink-500 border border-zinc-950 flex items-center justify-center text-[9px] font-bold text-white shadow-sm" title="Sarah">S</div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            3 active
          </div>
        </div>
      </div>

      {/* Mobile Panel Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 md:hidden select-none">
        <button
          type="button"
          onClick={() => setMobileTab("code")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-medium transition-all cursor-pointer ${
            mobileTab === "code" 
              ? "text-cyan-400 border-b border-cyan-400 bg-zinc-900/30" 
              : "text-zinc-500 hover:text-zinc-350 border-b border-transparent"
          }`}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-medium transition-all cursor-pointer ${
            mobileTab === "preview" 
              ? "text-cyan-400 border-b border-cyan-400 bg-zinc-900/30" 
              : "text-zinc-500 hover:text-zinc-350 border-b border-transparent"
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-medium transition-all cursor-pointer ${
            mobileTab === "chat" 
              ? "text-cyan-400 border-b border-cyan-400 bg-zinc-900/30" 
              : "text-zinc-500 hover:text-zinc-350 border-b border-transparent"
          }`}
        >
          Chat
        </button>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Sidebar Navigation */}
        <div className="hidden sm:flex w-12 border-r border-zinc-900 bg-zinc-950 flex-col items-center py-4 justify-between select-none">
          <div className="flex flex-col gap-5 items-center w-full">
            <button className="text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer relative" title="File Explorer">
              <FolderTree className="w-5 h-5 text-cyan-400" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r"></div>
            </button>
            <button className="text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer relative" title="Collaborators">
              <Users className="w-5 h-5" />
            </button>
            <button className="text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer relative" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="text-zinc-600 hover:text-zinc-450 cursor-pointer">
            <Info className="w-5 h-5" />
          </div>
        </div>

        {/* File Tree Explorer (Small sidebar) */}
        <div className="hidden md:flex flex-col w-44 bg-zinc-950/40 border-r border-zinc-900/80 p-3 select-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-3 block">Files</span>
          <div className="flex flex-col gap-1 text-xs">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                activeTab === "html" ? "bg-zinc-800/60 text-cyan-400" : "text-zinc-450 hover:bg-zinc-900/40"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-mono">index.html</span>
            </button>
            <button
              onClick={() => setActiveTab("css")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                activeTab === "css" ? "bg-zinc-800/60 text-cyan-400" : "text-zinc-450 hover:bg-zinc-900/40"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono">styles.css</span>
            </button>
            <button
              onClick={() => setActiveTab("js")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                activeTab === "js" ? "bg-zinc-800/60 text-cyan-400" : "text-zinc-450 hover:bg-zinc-900/40"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-mono">app.js</span>
            </button>
          </div>
        </div>

        {/* Code Editor view */}
        <div className={`flex-1 flex-col bg-zinc-950/20 overflow-hidden ${mobileTab === 'code' ? 'flex' : 'hidden md:flex'}`}>
          {/* File tabs for mobile */}
          <div className="flex border-b border-zinc-900 bg-zinc-950/60 md:hidden">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b transition-all ${
                activeTab === "html" ? "border-cyan-400 text-cyan-400 bg-zinc-900/40" : "border-transparent text-zinc-500"
              }`}
            >
              index.html
            </button>
            <button
              onClick={() => setActiveTab("css")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b transition-all ${
                activeTab === "css" ? "border-cyan-400 text-cyan-400 bg-zinc-900/40" : "border-transparent text-zinc-500"
              }`}
            >
              styles.css
            </button>
            <button
              onClick={() => setActiveTab("js")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b transition-all ${
                activeTab === "js" ? "border-cyan-400 text-cyan-400 bg-zinc-900/40" : "border-transparent text-zinc-500"
              }`}
            >
              app.js
            </button>
          </div>

          {/* Active file indicator / breadcrumb for desktop */}
          <div className="hidden md:flex items-center justify-between px-4 py-2 bg-zinc-900/30 border-b border-zinc-900 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1">
              <span>clock-widget</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className={activeTab === 'html' ? 'text-orange-400' : activeTab === 'css' ? 'text-purple-400' : 'text-yellow-400'}>
                {activeTab === "html" ? "index.html" : activeTab === "css" ? "styles.css" : "app.js"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase">Autosaved</span>
            </div>
          </div>

          {/* Code display area */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed select-text custom-scroll">
            {codeSnippets[activeTab].map((line, idx) => (
              <div key={idx} className="flex hover:bg-zinc-900/20 px-1 rounded transition-colors group">
                <span className="w-8 text-zinc-700 text-right select-none pr-3 block border-r border-zinc-900 mr-3">
                  {idx + 1}
                </span>
                <span className={`${line.color} whitespace-pre`}>
                  {line.text}
                </span>
              </div>
            ))}

            {/* Simulating code being typed by Sarah in JS file */}
            {activeTab === "js" && (
              <div className="flex hover:bg-zinc-900/20 px-1 rounded transition-colors relative">
                <span className="w-8 text-zinc-700 text-right select-none pr-3 block border-r border-zinc-900 mr-3">
                  {codeSnippets.js.length + 1}
                </span>
                <span className="text-yellow-400 whitespace-pre relative">
                  {simulatedCodeLine}
                  <span className="inline-block w-1.5 h-4 bg-pink-500 animate-pulse align-middle ml-0.5"></span>
                  <span className="absolute -top-5 left-full bg-pink-500 text-white text-[9px] font-sans px-1 rounded shadow-md whitespace-nowrap z-10">
                    Sarah
                  </span>
                </span>
              </div>
            )}

            {/* Render a visual cursor animation in HTML/CSS tab as well */}
            {activeTab === "html" && (
              <div className="relative">
                {/* Floating remote cursor for Alex */}
                <span className="absolute top-[160px] left-[180px] flex items-center pointer-events-none select-none">
                  <span className="h-4 w-0.5 bg-purple-500 animate-pulse"></span>
                  <span className="bg-purple-500 text-white text-[9px] font-sans px-1 py-0.2 rounded-sm shadow-md whitespace-nowrap ml-0.5 select-none">
                    Alex
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Mini Terminal (bottom of code editor) */}
          <div className="h-28 border-t border-zinc-900 bg-zinc-950 flex flex-col font-mono text-[10px] text-zinc-400">
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/60 border-b border-zinc-950 text-zinc-500">
              <div className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[9px]">Terminal</span>
              </div>
              <span className="text-[9px] text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.2 rounded">online</span>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-1 custom-scroll">
              {terminalLines.map((line, idx) => (
                <div key={idx} className={`${line.includes('Compiler') ? 'text-cyan-400' : line.includes('Runtime') ? 'text-amber-300' : 'text-zinc-500'}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Live Preview & Chat (Responsive side panel) */}
        <div className={`w-full md:w-72 border-t md:border-t-0 md:border-l border-zinc-900 bg-zinc-950/80 flex flex-col overflow-hidden ${
          mobileTab === 'preview' || mobileTab === 'chat' ? 'flex flex-1' : 'hidden md:flex'
        }`}>
          {/* Top Half: Live Sandbox Preview */}
          <div className={`flex-1 flex flex-col border-b border-zinc-900 min-h-[180px] bg-zinc-950/50 ${
            mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/30 border-b border-zinc-900 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 font-mono">
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                <span>Live Preview</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] text-zinc-500 font-mono">PORT: 3000</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 bg-[#07070a] relative overflow-hidden bg-grid-pattern">
              {/* Actual Clock Widget Output */}
              <div className="relative group bg-zinc-900/75 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-4 text-center max-w-[200px] w-full shadow-lg backdrop-blur-md transition-all duration-300">
                <div className="absolute inset-0 -z-10 bg-cyan-500/5 rounded-xl blur-lg group-hover:bg-cyan-500/10 transition-all duration-300"></div>
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">DevSpace Clock</h4>
                <div className="text-xl font-bold font-mono text-cyan-400 my-1 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  {timeString || "12:34:56 PM"}
                </div>
                <p className="text-[9px] text-zinc-400 font-sans">Real-Time Collaboration</p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]"></span>
                  <span className="text-[8px] text-emerald-400 uppercase font-mono tracking-wider font-semibold">Live Sandbox</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Half: Live Chat pane */}
          <div className={`flex-1 flex flex-col h-[200px] md:h-auto bg-zinc-950/80 ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/30 border-b border-zinc-900 text-xs text-zinc-400 select-none">
              <div className="flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Room Chat</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Channel: #general</span>
            </div>

            {/* Chat message logs */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scroll select-text">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-2 text-xs">
                  <div className={`w-5 h-5 rounded-full ${msg.avatarColor} text-white flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5 shadow-sm`}>
                    {msg.sender[0]}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`font-semibold text-[11px] ${msg.sender === 'You' ? 'text-cyan-400' : 'text-zinc-300'}`}>
                        {msg.sender}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-zinc-400 leading-normal text-[11px] break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 text-xs items-center text-zinc-500">
                  <span className="text-[10px] italic font-mono">Someone typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Message Input form */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-900 bg-zinc-950">
              <div className="relative flex items-center bg-zinc-900 rounded-md border border-zinc-800 focus-within:border-cyan-500/50 transition-colors">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask team or chat..."
                  className="w-full bg-transparent px-3 py-1.5 pr-8 text-xs text-slate-100 placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 p-1 rounded-md text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
