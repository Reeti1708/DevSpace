"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import Editor, { Monaco } from "@monaco-editor/react";
import { 
  Terminal as TerminalIcon, 
  Users, 
  MessageSquare, 
  Send, 
  FileCode, 
  ChevronLeft, 
  Copy, 
  Check, 
  Plus,
  Trash2,
  Edit3,
  Folder,
  Lock,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface UserPresence {
  socketId: string;
  username: string;
  color: string;
}

interface ChatMessage {
  roomId: string;
  sender: string;
  text: string;
  time: string;
  avatarColor: string;
  isSystem?: boolean;
}

interface RemoteCursorData {
  socketId: string;
  username: string;
  color: string;
  cursor: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
}

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const { user, fetchWithAuth } = useAuth();

  // URL Query values
  const urlUsername = searchParams.get("username") || "";
  const urlTheme = searchParams.get("theme") || "vs-dark";

  // State
  const [username, setUsername] = useState(urlUsername);
  const [showJoinModal, setShowJoinModal] = useState(!urlUsername);
  const [inputName, setInputName] = useState("");
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeFileName, setActiveFileName] = useState<string>("index.html");
  const [filesList, setFilesList] = useState<string[]>([]);
  const [previewTrigger, setPreviewTrigger] = useState<number>(0);
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const [renamingFileName, setRenamingFileName] = useState<string | null>(null);
  const [renameInputVal, setRenameInputVal] = useState<string>("");

  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "console">("preview");
  const [consoleLogs, setConsoleLogs] = useState<{ type: "log" | "error"; text: string; time: string }[]>([]);
  const [editorTheme, setEditorTheme] = useState(urlTheme);
  const [isCopied, setIsCopied] = useState(false);

  const [roomVisibility, setRoomVisibility] = useState<"public" | "readonly" | "private">("public");
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null);
  const [roomAccessError, setRoomAccessError] = useState<string | null>(null);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const wasDisconnectedRef = useRef(false);

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/[\s-_]+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Sync authenticated user details
  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        setUsername(user.username);
        setShowJoinModal(false);
      });
    }
  }, [user]);

  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [userColor] = useState(() => {
    const colors = ["#00f0ff", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];
    return colors[Math.floor(Math.random() * colors.length)];
  });
  const userColorRef = useRef<string>(userColor);

  // Keep a map of active remote cursors decorations in Monaco
  // remoteDecorations: socketId -> Array of decoration IDs
  const remoteDecorationsRef = useRef<Map<string, string[]>>(new Map());

  // Sync client-side scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const prevUsersRef = useRef<UserPresence[]>([]);

  const showToast = useCallback((message: string) => {
    if (message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") || message.toLowerCase().includes("protected") || message.toLowerCase().includes("denied") || message.toLowerCase().includes("exists")) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }, []);

  useEffect(() => {
    if (prevUsersRef.current.length === 0) {
      if (activeUsers.length > 0) {
        prevUsersRef.current = activeUsers;
      }
      return;
    }

    const prevUsers = prevUsersRef.current;
    
    const joined = activeUsers.filter(
      (u) => !prevUsers.some((pu) => pu.socketId === u.socketId)
    );
    const left = prevUsers.filter(
      (pu) => !activeUsers.some((u) => u.socketId === pu.socketId)
    );

    const systemMsgs: ChatMessage[] = [];
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    joined.forEach((u) => {
      if (u.username !== username) {
        toast.success(`${u.username} joined the room!`, { icon: '👋' });
        systemMsgs.push({
          roomId,
          sender: "System",
          text: `${u.username} joined the session`,
          time,
          avatarColor: "",
          isSystem: true
        });
      }
    });

    left.forEach((u) => {
      if (u.username !== username) {
        toast(`${u.username} left the room`, { icon: '🚪' });
        systemMsgs.push({
          roomId,
          sender: "System",
          text: `${u.username} left the session`,
          time,
          avatarColor: "",
          isSystem: true
        });
      }
    });

    if (systemMsgs.length > 0) {
      Promise.resolve().then(() => {
        setChatMessages((prev) => [...prev, ...systemMsgs]);
      });
    }

    prevUsersRef.current = activeUsers;
  }, [activeUsers, username, roomId]);

  // Remote cursors drawing in Monaco Editor using decorations
  const updateRemoteCursorDecoration = useCallback((data: RemoteCursorData) => {
    if (!editorRef.current || !monacoRef.current) return;

    const { socketId, username, color, cursor } = data;
    if (!cursor) return;

    // Create unique CSS class for remote cursor colors
    const styleId = `style-cursor-${socketId}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .remote-cursor-${socketId} {
          border-left: 2px solid ${color};
        }
        .remote-cursor-flag-${socketId} {
          background-color: ${color};
          color: #09090b;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 3px;
          position: absolute;
          z-index: 10;
          white-space: nowrap;
          transform: translateY(-100%);
          opacity: 0.85;
          pointer-events: none;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Setup new decoration list
    const range = new monaco.Range(
      cursor.startLineNumber,
      cursor.startColumn,
      cursor.endLineNumber,
      cursor.endColumn
    );

    const isSelection = range.startLineNumber !== range.endLineNumber || range.startColumn !== range.endColumn;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decorations: any[] = [
      // Cursor Line decoration
      {
        range: new monaco.Range(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn + 1),
        options: {
          className: `remote-cursor-${socketId}`,
          beforeContentClassName: `remote-cursor-flag-${socketId}`,
          hoverMessage: { value: `**${username}**` },
        }
      }
    ];

    if (isSelection) {
      decorations.push({
        range: range,
        options: {
          className: `bg-opacity-20`,
          inlineClassName: `selection-highlight`
        }
      });
    }

    // Replace old decoration arrays
    const oldDecorations = remoteDecorationsRef.current.get(socketId) || [];
    const newDecIds = editor.deltaDecorations(oldDecorations, decorations);
    remoteDecorationsRef.current.set(socketId, newDecIds);
  }, []);

  const removeRemoteCursorDecoration = useCallback((socketId: string) => {
    if (editorRef.current) {
      const oldDecs = remoteDecorationsRef.current.get(socketId) || [];
      editorRef.current.deltaDecorations(oldDecs, []);
      remoteDecorationsRef.current.delete(socketId);
    }
    const styleEl = document.getElementById(`style-cursor-${socketId}`);
    if (styleEl) styleEl.remove();
  }, []);

  // Handle connection start after username is confirmed
  useEffect(() => {
    if (!username) return;

    // 1. Initialize local Yjs Doc
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Setup local text maps
    const yfiles = ydoc.getMap("files");

    // Observe changes inside files map recursively (deep)
    yfiles.observeDeep(() => {
      const keys = Array.from(yfiles.keys()) as string[];
      setFilesList(keys);
      setPreviewTrigger((prev) => prev + 1);
    });

    // 2. Initialize Socket Connection
    toast.loading("Connecting to room workspace...", { id: "room-connect" });
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to real-time sync server.");
      if (wasDisconnectedRef.current) {
        toast.success("Connection restored!", { id: "room-connect" });
        wasDisconnectedRef.current = false;
      } else {
        toast.success(`Joined room: ${roomId}`, { id: "room-connect" });
      }
      socket.emit("room:join", { 
        roomId, 
        username, 
        color: userColorRef.current,
        token: localStorage.getItem("devspace_token")
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Connection failed. Retrying sync...", { id: "room-connect" });
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      if (reason === "io server disconnect" || reason === "transport close" || reason === "ping timeout") {
        wasDisconnectedRef.current = true;
        toast.error("Lost connection to server. Sync paused.", { id: "room-connect" });
      }
    });

    socket.on("room:info", ({ visibility, owner }) => {
      setRoomVisibility(visibility);
      setRoomOwnerId(owner);
    });

    socket.on("room:settings", ({ visibility }) => {
      setRoomVisibility(visibility);
      showToast(`Room visibility updated to ${visibility}`);
    });

    socket.on("room:join:error", ({ error }) => {
      setRoomAccessError(error);
      toast.error(`Access denied: ${error}`, { id: "room-connect" });
    });

    // 3. Receive initial full room Yjs update from server
    socket.on("yjs:init", (initBuffer: ArrayBuffer) => {
      try {
        const updateArray = new Uint8Array(initBuffer);
        Y.applyUpdate(ydoc, updateArray);
        // Sync files list immediately after load
        const keys = Array.from(yfiles.keys()) as string[];
        setFilesList(keys);
      } catch (err) {
        console.error("Yjs init error:", err);
      }
    });

    // 4. Receive incremental changes from other peers
    socket.on("yjs:update", (updateBuffer: ArrayBuffer) => {
      try {
        const updateArray = new Uint8Array(updateBuffer);
        Y.applyUpdate(ydoc, updateArray);
      } catch (err) {
        console.error("Yjs delta sync error:", err);
      }
    });

    // Listen to document changes to send delta updates to backend
    ydoc.on("update", (update, origin) => {
      // Avoid sending updates back if they came from socket events
      if (origin !== socket) {
        socket.emit("yjs:update", update.buffer);
      }
    });

    // 5. Presence & users list
    socket.on("room:users", (users: UserPresence[]) => {
      setActiveUsers(users);
    });

    // 6. Sockets chat integration
    socket.on("chat:history", (history: ChatMessage[]) => {
      setChatMessages(history);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // 7. Receive remote cursor position updates
    socket.on("cursor:update", (data) => {
      updateRemoteCursorDecoration(data);
    });

    socket.on("cursor:remove", ({ socketId }) => {
      removeRemoteCursorDecoration(socketId);
    });

    return () => {
      socket.disconnect();
      ydoc.destroy();
    };
  }, [username, roomId, BACKEND_URL, updateRemoteCursorDecoration, removeRemoteCursorDecoration, showToast]);

  const appendConsoleLog = useCallback((type: "log" | "error", text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setConsoleLogs((prev) => [...prev, { type, text, time }]);
  }, []);

  // Compile code into sandboxed iframe structure
  const compileAndRenderPreview = useCallback(() => {
    if (!iframeRef.current || !ydocRef.current) return;
    const iframe = iframeRef.current;
    const yfiles = ydocRef.current.getMap("files");

    // Check if files map is empty (still initializing)
    if (yfiles.size === 0) {
      iframe.srcdoc = `
        <body style="background:#09090b;color:#fafafa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <div style="width:24px;height:24px;border:2px solid #22d3ee;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px auto;"></div>
            <p style="color:#71717a;font-size:12px;font-family:monospace;">Connecting to collaborative sandbox...</p>
            <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
          </div>
        </body>
      `;
      return;
    }

    // Check if index.html exists
    const yHtml = yfiles.get("index.html") as Y.Text | undefined;
    if (!yHtml) {
      iframe.srcdoc = `
        <body style="background:#09090b;color:#fafafa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <p style="color:#22d3ee;font-weight:bold;font-size:16px;">No index.html entrypoint found.</p>
            <p style="color:#71717a;font-size:12px;">Create an "index.html" file to preview your application.</p>
          </div>
        </body>
      `;
      return;
    }

    const htmlContent = yHtml.toString();

    // 1. Process stylesheet links
    let compiledHtml = htmlContent;
    const linkRegex = /<link\s+[^>]*rel=["']stylesheet["']\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
    compiledHtml = compiledHtml.replace(linkRegex, (match, href) => {
      const yCss = yfiles.get(href) as Y.Text | undefined;
      if (yCss) {
        return `<style>/* ${href} */\n${yCss.toString()}</style>`;
      }
      return match;
    });

    // 2. Process scripts
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    compiledHtml = compiledHtml.replace(scriptRegex, (match, src) => {
      const yJs = yfiles.get(src) as Y.Text | undefined;
      if (yJs) {
        return `<script>/* ${src} */\n${yJs.toString()}</script>`;
      }
      return match;
    });

    // 3. Backward compatibility / auto-run script.js or app.js if not linked
    const hasJsScriptLinked = htmlContent.includes("script.js") || htmlContent.includes("app.js");
    let autoInjectedScript = "";
    if (!hasJsScriptLinked) {
      if (yfiles.has("script.js")) {
        const yScriptJs = yfiles.get("script.js") as Y.Text;
        autoInjectedScript = `<script>/* Auto-injected script.js */\n${yScriptJs.toString()}</script>`;
      } else if (yfiles.has("app.js")) {
        const yAppJs = yfiles.get("app.js") as Y.Text;
        autoInjectedScript = `<script>/* Auto-injected app.js */\n${yAppJs.toString()}</script>`;
      }
    }

    // 4. Inject log relay
    const relayScript = `
      <script>
        // Relay console logs to host Next.js window
        const logRelay = (type, args) => {
          window.parent.postMessage({
            type: type === 'error' ? 'CONSOLE_ERROR' : 'CONSOLE_LOG',
            content: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')
          }, '*');
        };

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
          originalLog(...args);
          logRelay('log', args);
        };

        console.warn = (...args) => {
          originalWarn(...args);
          logRelay('log', ["[WARNING]:", ...args]);
        };

        console.error = (...args) => {
          originalError(...args);
          logRelay('error', args);
        };

        window.onerror = (message, source, lineno, colno, error) => {
          logRelay('error', [message + " (Line " + lineno + ")"]);
        };
      </script>
    `;

    if (compiledHtml.includes("<body>")) {
      compiledHtml = compiledHtml.replace("<body>", `<body>\n${relayScript}`);
    } else {
      compiledHtml = relayScript + compiledHtml;
    }

    if (autoInjectedScript) {
      if (compiledHtml.includes("</body>")) {
        compiledHtml = compiledHtml.replace("</body>", `${autoInjectedScript}\n</body>`);
      } else {
        compiledHtml = compiledHtml + autoInjectedScript;
      }
    }

    iframe.srcdoc = compiledHtml;
  }, []);

  // Catch frame console messages
  useEffect(() => {
    const handleConsoleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "CONSOLE_LOG") {
        appendConsoleLog("log", e.data.content);
      } else if (e.data && e.data.type === "CONSOLE_ERROR") {
        appendConsoleLog("error", e.data.content);
      }
    };
    window.addEventListener("message", handleConsoleMessage);
    return () => window.removeEventListener("message", handleConsoleMessage);
  }, [appendConsoleLog]);

  // Sandbox compilation effect (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      compileAndRenderPreview();
    }, 400); // Debounce compiler
    return () => clearTimeout(timer);
  }, [previewTrigger, compileAndRenderPreview]);

  // Fallback for active file deletion
  useEffect(() => {
    if (filesList.length > 0 && !filesList.includes(activeFileName)) {
      setTimeout(() => {
        if (filesList.includes("index.html")) {
          setActiveFileName("index.html");
        } else {
          setActiveFileName(filesList[0]);
        }
      }, 0);
    }
  }, [filesList, activeFileName]);

  // Capture local cursor changes to send to socket
  const handleEditorChange = () => {
    if (!editorRef.current || !socketRef.current) return;
    
    const selection = editorRef.current.getSelection();
    if (selection) {
      socketRef.current.emit("cursor:update", {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn
      });
    }
  };

  const updateEditorModel = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !ydocRef.current || !activeFileName) return;

    const monaco = monacoRef.current;
    const ydoc = ydocRef.current;
    
    // Determine language based on file extension
    let language = "plaintext";
    if (activeFileName.endsWith(".html")) language = "html";
    else if (activeFileName.endsWith(".css")) language = "css";
    else if (activeFileName.endsWith(".js") || activeFileName.endsWith(".jsx")) language = "javascript";
    else if (activeFileName.endsWith(".json")) language = "json";
    else if (activeFileName.endsWith(".md")) language = "markdown";

    // Get the shared Yjs text from the files map
    const yfiles = ydoc.getMap("files");
    const yText = yfiles.get(activeFileName) as Y.Text | undefined;
    if (!yText) return;

    // Create or retrieve model
    const uriString = `inmemory://model-${activeFileName}`;
    let model = monaco.editor.getModel(monaco.Uri.parse(uriString));

    if (!model) {
      model = monaco.editor.createModel(yText.toString(), language, monaco.Uri.parse(uriString));
      
      // Keep model in sync with Yjs
      model.onDidChangeContent(() => {
        const val = model.getValue();
        if (yText.toString() !== val) {
          yText.delete(0, yText.length);
          yText.insert(0, val);
        }
      });

      // Keep Yjs in sync with model (peer updates)
      yText.observe(() => {
        const val = yText.toString();
        if (model.getValue() !== val) {
          const position = editorRef.current.getPosition();
          model.setValue(val);
          if (position) editorRef.current.setPosition(position);
        }
      });
    }

    editorRef.current.setModel(model);
  }, [activeFileName]);

  // Setup Monaco bindings and listeners
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply cursor listeners
    editor.onDidChangeCursorPosition(handleEditorChange);
    editor.onDidChangeCursorSelection(handleEditorChange);

    // Apply the active tab model to Monaco
    updateEditorModel();
  };

  // Sync active tab files in Monaco Editor
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateEditorModel();
    }
  }, [activeFileName, updateEditorModel]);




  const handleVisibilityChange = async (visibility: "public" | "readonly" | "private") => {
    setUpdatingSettings(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/rooms/${roomId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility })
      });
      if (res.ok) {
        setRoomVisibility(visibility);
        showToast(`Room visibility updated to ${visibility}`);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update room settings");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection failed.");
    }
    setUpdatingSettings(false);
  };

  const isReadOnlyUser = roomVisibility === "readonly" && (!user || user.id !== roomOwnerId);

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (!name) return;
    
    // Check if filename has valid extension
    if (!name.includes(".")) {
      showToast("Please provide a file extension (e.g., .html, .css, .js)");
      return;
    }

    if (filesList.includes(name)) {
      showToast("A file with this name already exists.");
      return;
    }
    
    const yfiles = ydocRef.current?.getMap("files");
    if (yfiles) {
      const ytext = new Y.Text();
      
      // Default templates based on extension
      let defaultVal = "";
      if (name.endsWith(".html")) {
        defaultVal = `<!-- ${name} -->\n<div class="container">\n  \n</div>`;
      } else if (name.endsWith(".css")) {
        defaultVal = `/* ${name} */\n`;
      } else if (name.endsWith(".js")) {
        defaultVal = `// ${name}\nconsole.log("${name} loaded");\n`;
      }
      
      ytext.insert(0, defaultVal);
      yfiles.set(name, ytext);
      
      setActiveFileName(name);
      setIsCreatingFile(false);
      setNewFileName("");
      showToast(`Created file: ${name}`);
    }
  };

  const handleRenameFileSubmit = (e: React.FormEvent, oldName: string) => {
    e.preventDefault();
    const newName = renameInputVal.trim();
    if (!newName || newName === oldName) {
      setRenamingFileName(null);
      return;
    }

    if (!newName.includes(".")) {
      showToast("Please include a file extension.");
      return;
    }

    if (filesList.includes(newName)) {
      showToast("A file with this name already exists.");
      return;
    }

    const yfiles = ydocRef.current?.getMap("files");
    if (yfiles) {
      const ytext = yfiles.get(oldName) as Y.Text | undefined;
      if (ytext) {
        const newYText = new Y.Text();
        newYText.insert(0, ytext.toString());
        yfiles.set(newName, newYText);
        yfiles.delete(oldName);
        
        if (activeFileName === oldName) {
          setActiveFileName(newName);
        }
        setRenamingFileName(null);
        showToast(`Renamed ${oldName} to ${newName}`);
      }
    }
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === "index.html") {
      showToast("Protected file: 'index.html' cannot be deleted.");
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to delete "${fileName}"?`);
    if (!confirmDelete) return;

    const yfiles = ydocRef.current?.getMap("files");
    if (yfiles) {
      yfiles.delete(fileName);
      showToast(`Deleted file: ${fileName}`);
    }
  };

  // Focus create file input
  useEffect(() => {
    if (isCreatingFile) {
      createFileInputRef.current?.focus();
    }
  }, [isCreatingFile]);
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const payload = {
      sender: username,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatarColor: userColorRef.current
    };

    socketRef.current.emit("chat:send", payload);
    setNewMessage("");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    showToast("Invite link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };



  // Join Room username handler modal
  const handleJoinModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setUsername(inputName.trim());
    setShowJoinModal(false);
  };

  if (roomAccessError) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-rose-500/5 blur-3xl -z-10 animate-pulse"></div>
        
        <div className="w-full max-w-sm bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl text-center space-y-5">
          <Lock className="w-10 h-10 text-rose-550 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground font-mono">Access Restricted</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">
            {roomAccessError}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="flex-1 h-10 inline-flex items-center justify-center rounded-xl bg-cyan-400 font-mono font-bold text-xs text-zinc-950 hover:bg-cyan-350 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 h-10 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-mono font-medium text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans select-none">
      


      {/* Header */}
      <header className="h-14 shrink-0 border-b border-card-border bg-header-bg backdrop-blur-xl flex items-center justify-between px-4 z-10">
        
        {/* Logo and Room Details */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="p-1.5 hover:bg-zinc-800/20 rounded-lg text-text-muted hover:text-foreground transition-all cursor-pointer"
            title="Leave Room"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="h-4 w-[1px] bg-card-border"></div>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted uppercase tracking-wider">Room:</span>
            <span className="font-mono text-sm font-bold text-foreground bg-zinc-900/60 px-2 py-0.5 rounded border border-card-border">{roomId}</span>
          </div>
        </div>

        {/* Presence avatars & Invite */}
        <div className="flex items-center gap-4">
          
          {/* User list presence */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/40 px-2.5 py-1 rounded-full border border-card-border">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono text-text-muted mr-1.5">{activeUsers.length}</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {activeUsers.map((user) => (
                <div 
                  key={user.socketId}
                  className="w-5 h-5 rounded-full border border-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-950 capitalize"
                  style={{ backgroundColor: user.color }}
                  title={user.username}
                >
                  {user.username.slice(0, 2)}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Chat Toggle Button */}
          <button
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
            className="h-8 w-8 flex md:hidden items-center justify-center rounded-lg border border-card-border bg-card-bg hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 text-zinc-400 hover:text-foreground transition-all cursor-pointer relative"
            title="Toggle Live Chat"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
          </button>

          {/* Share & Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setIsSharingOpen(!isSharingOpen)}
              className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card-bg hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10 px-3 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Share & Settings</span>
            </button>
            
            {isSharingOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-card-border rounded-xl shadow-2xl p-4 z-50 font-mono text-xs text-left animate-fade-in space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="font-bold text-foreground">Workspace Sharing</span>
                  <button 
                    onClick={() => setIsSharingOpen(false)}
                    className="text-zinc-500 hover:text-foreground text-[10px]"
                  >
                    Close
                  </button>
                </div>

                {/* Invite Link */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Invite Link</label>
                  <div className="flex gap-2 items-center bg-zinc-900 rounded-lg p-1 border border-zinc-850">
                    <input 
                      type="text" 
                      readOnly 
                      value={typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : ""}
                      className="w-full bg-transparent px-2 text-[10px] text-cyan-400 focus:outline-none selection:bg-cyan-500/20"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-foreground transition-all cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Visibility Settings (Only if owner) */}
                {user && user.id === roomOwnerId ? (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Workspace Visibility</label>
                    <select
                      value={roomVisibility}
                      onChange={(e) => handleVisibilityChange(e.target.value as "public" | "readonly" | "private")}
                      disabled={updatingSettings}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="public">Public (Collaborative)</option>
                      <option value="readonly">Public Read-Only (Peers view only)</option>
                      <option value="private">Private (Owner access only)</option>
                    </select>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 flex justify-between">
                    <span>Access Level: </span>
                    <span className="text-cyan-400 font-bold uppercase">{roomVisibility}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editor Theme Switcher */}
          <select 
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            className="h-8 bg-zinc-900 border border-card-border rounded-lg text-xs font-mono px-2 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="vs-dark">VS Dark</option>
            <option value="light">Monaco Light</option>
            <option value="hc-black">High Contrast</option>
          </select>

        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: File Explorer */}
        <div className="w-56 sm:w-64 bg-zinc-950 border-r border-card-border flex flex-col shrink-0 select-none">
          {/* Header */}
          <div className="h-10 shrink-0 border-b border-card-border flex items-center justify-between px-3 select-none">
            <span className="font-mono text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workspace Files</span>
            </span>
            {!isReadOnlyUser && (
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New File Inline Form */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFileSubmit} className="p-2 bg-zinc-900 border-b border-card-border flex items-center gap-1.5 animate-fade-in">
              <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                ref={createFileInputRef}
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    if (newFileName.trim() === "") setIsCreatingFile(false);
                  }, 150);
                }}
                placeholder="filename.html"
                className="bg-transparent border-none focus:outline-none text-xs font-mono w-full text-foreground placeholder-zinc-600"
              />
            </form>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto py-1">
            {filesList.length === 0 ? (
              <div className="text-[10px] text-zinc-600 text-center font-mono py-4">No files sync&apos;d</div>
            ) : (
              filesList.map((fileName) => {
                const isSelected = activeFileName === fileName;
                const isHtml = fileName.endsWith(".html");
                const isCss = fileName.endsWith(".css");
                const isJs = fileName.endsWith(".js") || fileName.endsWith(".jsx");
                const isJson = fileName.endsWith(".json");
                
                let iconColor = "text-zinc-400";
                if (isHtml) iconColor = "text-orange-500";
                else if (isCss) iconColor = "text-blue-400";
                else if (isJs) iconColor = "text-yellow-500";
                else if (isJson) iconColor = "text-purple-400";

                return (
                  <div 
                    key={fileName}
                    className={`group flex items-center justify-between px-3 py-1.5 mx-1.5 my-0.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? "bg-zinc-800/80 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 font-bold" 
                        : "text-text-muted hover:bg-zinc-900/60 hover:text-foreground border border-transparent"
                    }`}
                    onClick={() => {
                      if (renamingFileName !== fileName) {
                        setActiveFileName(fileName);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                      
                      {renamingFileName === fileName ? (
                        <form 
                          onSubmit={(e) => handleRenameFileSubmit(e, fileName)}
                          className="flex-1 flex"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            required
                            value={renameInputVal}
                            onChange={(e) => setRenameInputVal(e.target.value)}
                            onBlur={() => setRenamingFileName(null)}
                            className="bg-zinc-900 border border-cyan-500/30 rounded px-1 py-0.5 text-xs font-mono text-foreground focus:outline-none w-full"
                            autoFocus
                          />
                        </form>
                      ) : (
                        <span className="truncate" title={fileName}>{fileName}</span>
                      )}
                    </div>

                    {/* Action Buttons (Rename / Delete) */}
                    {renamingFileName !== fileName && !isReadOnlyUser && (
                      <div className="hidden group-hover:flex items-center gap-1.5 shrink-0 pl-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setRenamingFileName(fileName);
                            setRenameInputVal(fileName);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-cyan-400 transition-colors"
                          title="Rename File"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {fileName !== "index.html" && (
                          <button
                            onClick={() => handleDeleteFile(fileName)}
                            className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Monaco Editor Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File Header Info tab status */}
          <div className="h-10 shrink-0 bg-zinc-950 border-b border-card-border flex items-center justify-between px-4 select-none">
            <div className="flex items-center gap-2 font-mono text-xs text-foreground">
              <span className="text-zinc-500">Editing:</span>
              <span className="font-bold text-cyan-400 bg-zinc-900/60 px-2.5 py-1 rounded border border-card-border">{activeFileName}</span>
            </div>
            
            <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Syncing Live</span>
            </div>
          </div>

          {/* Monaco Editor Wrapper */}
          <div className="flex-1 bg-zinc-950 relative">
            {!username ? (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs font-mono">
                Waiting for workspace authentication...
              </div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage="html"
                theme={editorTheme}
                loading={
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                    <span className="font-mono text-xs text-text-muted">Loading Monaco...</span>
                  </div>
                }
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  readOnly: isReadOnlyUser,
                  autoIndent: "full",
                  matchBrackets: "always"
                }}
              />
            )}
          </div>
        </div>

        {/* Right Split Panel (Sandbox Rendering and Terminal) */}
        <div className="w-[40%] hidden lg:flex flex-col border-r border-card-border min-w-[300px]">
          
          {/* Top Panel: Toggle Tabs */}
          <div className="h-10 shrink-0 bg-zinc-950 border-b border-card-border flex items-center px-4 justify-between select-none">
            <div className="flex gap-2">
              <button 
                onClick={() => setRightPanelTab("preview")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  rightPanelTab === "preview" 
                    ? "bg-zinc-800 text-cyan-400 border border-card-border" 
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Sandbox Preview
              </button>
              <button 
                onClick={() => setRightPanelTab("console")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  rightPanelTab === "console" 
                    ? "bg-zinc-800 text-cyan-400 border border-card-border" 
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Console Terminal</span>
                {consoleLogs.filter(l => l.type === "error").length > 0 && (
                  <span className="px-1 bg-rose-500 text-white rounded-[4px] text-[8px] font-bold">
                    {consoleLogs.filter(l => l.type === "error").length}
                  </span>
                )}
              </button>
            </div>

            {rightPanelTab === "console" && consoleLogs.length > 0 && (
              <button 
                onClick={() => setConsoleLogs([])}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Clear logs
              </button>
            )}
          </div>

          {/* Bottom Panel Contents */}
          <div className="flex-1 bg-zinc-900 relative">
            
            {/* Tab 1: Iframe preview */}
            <div className={`w-full h-full ${rightPanelTab === "preview" ? "block" : "hidden"}`}>
              <iframe
                ref={iframeRef}
                title="Code execution sandbox"
                sandbox="allow-scripts"
                className="w-full h-full bg-white border-none"
              />
            </div>

            {/* Tab 2: Console panel */}
            <div className={`w-full h-full overflow-y-auto p-4 font-mono text-xs space-y-2 bg-black text-slate-350 select-text ${
              rightPanelTab === "console" ? "block" : "hidden"
            }`}>
              {consoleLogs.length === 0 ? (
                <div className="text-zinc-600 text-center pt-10 select-none">
                  Console is empty. logs and errors will be routed here.
                </div>
              ) : (
                consoleLogs.map((log, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-2 border-b border-zinc-900/50 pb-1.5 ${
                      log.type === "error" ? "text-rose-400 bg-rose-950/10 px-1 rounded" : ""
                    }`}
                  >
                    <span className="text-[10px] text-zinc-500 select-none pt-0.5">{log.time}</span>
                    <span className="shrink-0 select-none">{log.type === "error" ? "✗" : "›"}</span>
                    <span className="break-all whitespace-pre-wrap">{log.text}</span>
                  </div>
                ))
              )}
            </div>

        </div>
      </div>
      
      {/* Mobile Chat Backdrop overlay */}
      {isMobileChatOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileChatOpen(false)}
        />
      )}

      {/* Sidebar: Sockets Chat Panel (Desktop: Sidebar, Mobile: Slide-out drawer) */}
      <div className={`fixed inset-y-0 right-0 z-40 w-[300px] bg-zinc-955 dark:bg-zinc-950 border-l border-card-border flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 md:z-10 md:flex ${
        isMobileChatOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        
        <div className="h-10 shrink-0 border-b border-card-border flex items-center justify-between px-4 font-mono text-xs font-bold text-foreground">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Room Live Chat</span>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileChatOpen(false)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-foreground md:hidden transition-colors cursor-pointer border-none bg-transparent"
            title="Close Chat"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 select-none">
              <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
              <span className="text-xs text-zinc-500 font-mono">No messages yet. Start discussing logic!</span>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              if (msg.isSystem) {
                return (
                  <div key={index} className="flex items-center justify-center py-1">
                    <div className="text-[10px] text-zinc-500 font-mono px-3 py-1 bg-zinc-900/35 border border-zinc-900/60 rounded-full flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-pulse"></span>
                      <span>{msg.text}</span>
                      <span className="text-zinc-600 font-normal">•</span>
                      <span>{msg.time}</span>
                    </div>
                  </div>
                );
              }

              const isMe = msg.sender === username;

              return (
                <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 group`}>
                  
                  {/* Header info */}
                  <div className="flex items-center gap-2 px-1 select-none">
                    {!isMe && (
                      <>
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-950 uppercase"
                          style={{ backgroundColor: msg.avatarColor || "#a855f7" }}
                        >
                          {getInitials(msg.sender)}
                        </div>
                        <span className="text-xs font-bold text-foreground/90 font-sans">{msg.sender}</span>
                      </>
                    )}
                    <span className="text-[9px] text-zinc-500 font-mono">{msg.time}</span>
                    {isMe && (
                      <>
                        <span className="text-xs font-bold text-cyan-400 font-sans">You</span>
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-955 uppercase"
                          style={{ backgroundColor: userColor }}
                        >
                          {getInitials(msg.sender)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chat Bubble */}
                  <div className={`text-xs max-w-[85%] rounded-2xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap break-all shadow-sm ${
                    isMe 
                      ? "bg-cyan-950/40 border border-cyan-500/25 text-cyan-100 rounded-tr-sm" 
                      : "bg-zinc-900/60 border border-zinc-800/80 text-foreground/90 rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>

                </div>
              );
            }))}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input form */}
        <form onSubmit={handleSendChat} className="p-3 border-t border-card-border bg-zinc-950 flex gap-2">
          <input
            type="text"
            required
            placeholder="Discuss code..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-zinc-900 border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none placeholder-zinc-600 transition-colors font-sans"
          />
          <button
            type="submit"
            className="h-8 w-8 bg-cyan-400 hover:bg-cyan-300 text-zinc-950 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 border-none animate-pulse-slow"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      </div>

      {/* Force Ask Username Modal if not in url query */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-card-bg border border-card-border rounded-2xl shadow-2xl p-6 relative">
            <form onSubmit={handleJoinModalSubmit} className="space-y-5">
              <div className="space-y-1 text-center">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground font-mono">Join Workspace</h3>
                <p className="text-text-muted text-xs">
                  Enter your display name to connect to this coding session.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted font-mono">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-background border border-card-border focus:border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none placeholder-zinc-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 inline-flex items-center justify-center rounded-xl bg-cyan-400 font-mono font-bold text-xs text-zinc-950 hover:bg-cyan-350 transition-colors cursor-pointer"
              >
                Authenticate & Enter
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
