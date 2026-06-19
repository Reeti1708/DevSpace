import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as Y from "yjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : ["*"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf("*") !== -1 || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".onrender.com")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// AUTHENTICATION MIDDLEWARE
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || "devspace-secret-key-123", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Access token required" });
  }
  next();
}

app.use(authenticateToken);

const PORT = process.env.PORT || 5001;

// MONGODB CONFIGURATION & FALLBACKS
const MONGO_URI = process.env.MONGO_URI;
let dbConnected = false;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("[MongoDB] Database connected successfully.");
      dbConnected = true;
    })
    .catch((err) => {
      console.error("[MongoDB] Connection error:", err.message);
      console.log("[Server] Falling back to in-memory workspace storage.");
    });
} else {
  console.log("[MongoDB] MONGO_URI not configured. Running with in-memory workspace storage.");
}

// DATABASE SCHEMAS & MODELS
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, default: "" }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  visibility: { type: String, enum: ["public", "readonly", "private"], default: "public" },
  createdAt: { type: Date, default: Date.now },
  files: [FileSchema]
});

const ChatSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true },
  avatarColor: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const UserModel = mongoose.model("User", UserSchema);
const RoomModel = mongoose.model("Room", RoomSchema);
const ChatModel = mongoose.model("Chat", ChatSchema);

// DEFAULT TEMPLATE FILES FOR NEW ROOMS
const DEFAULT_FILES = [
  {
    name: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevSpace Playground</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Welcome to DevSpace!</h1>
  <p>Start collaborating by editing index.html, style.css, or script.js in real time.</p>
  <button id="clickBtn">Click Me</button>
  
  <script src="script.js"></script>
</body>
</html>`
  },
  {
    name: "style.css",
    content: `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #09090b;
  color: #f4f4f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  text-align: center;
}

h1 {
  color: #22d3ee;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

p {
  color: #a1a1aa;
  margin-bottom: 1.5rem;
}

button {
  background: #22d3ee;
  color: #09090b;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #67e8f9;
  transform: translateY(-1px);
}`
  },
  {
    name: "script.js",
    content: `// script.js - Write custom logic here!
console.log("JavaScript execution context initialized.");

const button = document.getElementById("clickBtn");
if (button) {
  button.addEventListener("click", () => {
    console.log("Button clicked!");
    alert("Hello from DevSpace!");
  });
}`
  }
];

// IN-MEMORY STORAGE FALLBACKS
const memoryRooms = new Map(); // roomId -> { name, files: [] }
const memoryChats = new Map(); // roomId -> Array of chat messages

// ACTIVE ROOM DOCUMENTS & AWARENESS (IN-MEMORY FOR REAL-TIME SESSIONS)
// roomsState: roomId -> { ydoc: Y.Doc, users: Map(socketId -> { username, color, cursor }) }
const roomsState = new Map();

// AUTHENTICATION ENDPOINTS
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (dbConnected) {
      const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ error: "Username or Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new UserModel({
        username,
        email,
        password: hashedPassword
      });
      await user.save();

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "devspace-secret-key-123",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        token,
        user: { id: user._id, username: user.username, email: user.email }
      });
    } else {
      if (!global.memoryUsers) {
        global.memoryUsers = new Map();
      }
      for (const u of global.memoryUsers.values()) {
        if (u.username === username || u.email === email) {
          return res.status(400).json({ error: "Username or Email already registered" });
        }
      }
      const userId = "mem-user-" + Math.random().toString(36).substring(2, 8);
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: userId, username, email, password: hashedPassword };
      global.memoryUsers.set(userId, user);

      const token = jwt.sign(
        { userId, username, email },
        process.env.JWT_SECRET || "devspace-secret-key-123",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        token,
        user: { id: userId, username, email }
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    if (dbConnected) {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET || "devspace-secret-key-123",
        { expiresIn: "7d" }
      );

      res.status(200).json({
        token,
        user: { id: user._id, username: user.username, email: user.email }
      });
    } else {
      if (!global.memoryUsers) {
        global.memoryUsers = new Map();
      }
      let foundUser = null;
      for (const u of global.memoryUsers.values()) {
        if (u.email === email) {
          foundUser = u;
          break;
        }
      }
      if (!foundUser) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: foundUser.id, username: foundUser.username, email: foundUser.email },
        process.env.JWT_SECRET || "devspace-secret-key-123",
        { expiresIn: "7d" }
      );

      res.status(200).json({
        token,
        user: { id: foundUser.id, username: foundUser.username, email: foundUser.email }
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

// REST API ENDPOINTS
// Fetch list of rooms owned by the user
app.get("/api/rooms", requireAuth, async (req, res) => {
  try {
    if (dbConnected) {
      const rooms = await RoomModel.find({ owner: req.user.userId }).select("roomId name visibility createdAt");
      res.status(200).json(rooms);
    } else {
      const rooms = [];
      memoryRooms.forEach((r, rId) => {
        if (r.owner === req.user.userId) {
          rooms.push({
            roomId: rId,
            name: r.name,
            visibility: r.visibility || "public",
            createdAt: r.createdAt || new Date()
          });
        }
      });
      res.status(200).json(rooms);
    }
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create or fetch a room
app.post("/api/rooms", async (req, res) => {
  const { roomId, name, visibility } = req.body;
  if (!roomId || !name) {
    return res.status(400).json({ error: "roomId and name are required" });
  }

  const owner = req.user ? req.user.userId : null;
  const roomVis = visibility || "public";

  try {
    let roomName = name;
    let roomVisibility = roomVis;
    let roomOwner = owner;

    if (dbConnected) {
      let room = await RoomModel.findOne({ roomId });
      if (!room) {
        room = new RoomModel({ 
          roomId, 
          name, 
          files: DEFAULT_FILES, 
          owner: owner || null,
          visibility: roomVis
        });
        await room.save();
        console.log(`[Database] Created room: ${roomId} (${name}) by ${owner ? owner : "guest"}`);
      } else {
        roomName = room.name;
        roomVisibility = room.visibility || "public";
        roomOwner = room.owner ? room.owner.toString() : null;
        console.log(`[Database] Room fetched: ${roomId}`);
      }
    } else {
      if (!memoryRooms.has(roomId)) {
        memoryRooms.set(roomId, { 
          name, 
          files: DEFAULT_FILES.map(f => ({ ...f })), 
          owner: owner || null,
          visibility: roomVis
        });
        console.log(`[In-Memory] Created room: ${roomId} (${name}) by ${owner ? owner : "guest"}`);
      } else {
        const room = memoryRooms.get(roomId);
        roomName = room.name;
        roomVisibility = room.visibility || "public";
        roomOwner = room.owner;
        console.log(`[In-Memory] Room fetched: ${roomId}`);
      }
    }

    res.status(200).json({ roomId, name: roomName, visibility: roomVisibility, owner: roomOwner });
  } catch (error) {
    console.error("Error creating/fetching room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update room settings (visibility)
app.patch("/api/rooms/:roomId/settings", requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const { visibility } = req.body;
  if (!visibility || !["public", "readonly", "private"].includes(visibility)) {
    return res.status(400).json({ error: "Invalid visibility value" });
  }

  try {
    if (dbConnected) {
      const room = await RoomModel.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      if (!room.owner || room.owner.toString() !== req.user.userId) {
        return res.status(403).json({ error: "Only the owner can modify settings" });
      }
      room.visibility = visibility;
      await room.save();
      
      const session = roomsState.get(roomId);
      if (session) {
        session.visibility = visibility;
      }
    } else {
      const room = memoryRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      if (room.owner !== req.user.userId) {
        return res.status(403).json({ error: "Only the owner can modify settings" });
      }
      room.visibility = visibility;
      
      const session = roomsState.get(roomId);
      if (session) {
        session.visibility = visibility;
      }
    }

    io.to(roomId).emit("room:settings", { visibility });
    res.status(200).json({ success: true, visibility });
  } catch (error) {
    console.error("Error updating room settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch chat history for a room
app.get("/api/rooms/:roomId/chats", async (req, res) => {
  const { roomId } = req.params;
  try {
    if (dbConnected) {
      const chats = await ChatModel.find({ roomId }).sort({ timestamp: 1 });
      res.status(200).json(chats);
    } else {
      const chats = memoryChats.get(roomId) || [];
      res.status(200).json(chats);
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// START HTTP + SOCKET.IO SERVER
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

// SOCKET CONNECTION HANDLER
io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // When a user joins a room
  socket.on("room:join", async ({ roomId, username, color, token }) => {
    // 1. Decode token to find user identity
    let socketUser = null;
    if (token) {
      try {
        socketUser = jwt.verify(token, process.env.JWT_SECRET || "devspace-secret-key-123");
      } catch (err) {
        console.log("[Socket] Invalid token passed during room join.");
      }
    }

    // 2. Load room configuration to verify visibility permissions
    let roomVisibility = "public";
    let roomOwner = null;

    if (dbConnected) {
      const roomDoc = await RoomModel.findOne({ roomId });
      if (roomDoc) {
        roomVisibility = roomDoc.visibility || "public";
        roomOwner = roomDoc.owner ? roomDoc.owner.toString() : null;
      }
    } else {
      const roomDoc = memoryRooms.get(roomId);
      if (roomDoc) {
        roomVisibility = roomDoc.visibility || "public";
        roomOwner = roomDoc.owner;
      }
    }

    const isOwner = socketUser && socketUser.userId === roomOwner;

    // 3. Enforce private room access security
    if (roomVisibility === "private" && !isOwner) {
      socket.emit("room:join:error", { error: "This room is private and can only be accessed by the owner." });
      return;
    }

    // 4. Enforce read-only access flags
    const isReadOnly = roomVisibility === "readonly" && !isOwner;
    socket.isReadOnly = isReadOnly;

    socket.join(roomId);
    console.log(`[Socket] ${username} (${socket.id}) joined room: ${roomId} [ReadOnly: ${isReadOnly}]`);

    // Initialize room session if not already active
    if (!roomsState.has(roomId)) {
      const ydoc = new Y.Doc();
      const yfiles = ydoc.getMap("files");
      
      let initialFiles = [];

      if (dbConnected) {
        const roomDoc = await RoomModel.findOne({ roomId });
        if (roomDoc) {
          if (roomDoc.files && roomDoc.files.length > 0) {
            initialFiles = roomDoc.files;
          } else {
            initialFiles = [
              { name: "index.html", content: roomDoc.documentStateHtml || "" },
              { name: "styles.css", content: roomDoc.documentStateCss || "" },
              { name: "app.js", content: roomDoc.documentStateJs || "" }
            ];
          }
        }
      } else {
        const roomDoc = memoryRooms.get(roomId);
        if (roomDoc) {
          if (roomDoc.files && roomDoc.files.length > 0) {
            initialFiles = roomDoc.files;
          } else {
            initialFiles = [
              { name: "index.html", content: roomDoc.html || "" },
              { name: "styles.css", content: roomDoc.css || "" },
              { name: "app.js", content: roomDoc.js || "" }
            ];
          }
        }
      }

      if (initialFiles.length === 0) {
        initialFiles = DEFAULT_FILES;
      }

      initialFiles.forEach((file) => {
        const ytext = new Y.Text();
        ytext.insert(0, file.content);
        yfiles.set(file.name, ytext);
      });

      roomsState.set(roomId, {
        ydoc,
        users: new Map(),
        visibility: roomVisibility
      });
    }

    const roomSession = roomsState.get(roomId);
    
    // Add user to the active room list
    roomSession.users.set(socket.id, {
      username,
      color: color || "#00f0ff",
      cursor: null
    });

    // 1. Send the current Yjs code document state (full state vector)
    const stateVector = Y.encodeStateAsUpdate(roomSession.ydoc);
    // Send as Uint8Array/Buffer representation
    socket.emit("yjs:init", Buffer.from(stateVector));

    // Send visibility and owner details to client
    socket.emit("room:info", { visibility: roomVisibility, owner: roomOwner });

    // 2. Broadcast updated user presence list
    const activeUsers = Array.from(roomSession.users.entries()).map(([sid, u]) => ({
      socketId: sid,
      username: u.username,
      color: u.color
    }));
    io.to(roomId).emit("room:users", activeUsers);

    // 3. Send chat history
    let chats = [];
    if (dbConnected) {
      chats = await ChatModel.find({ roomId }).sort({ timestamp: 1 });
    } else {
      chats = memoryChats.get(roomId) || [];
    }
    socket.emit("chat:history", chats);

    // Handle incoming Yjs updates from the client
    socket.on("yjs:update", (updateBuffer) => {
      // Disallow Yjs document updates if the socket has read-only access
      if (socket.isReadOnly) {
        return;
      }
      try {
        const updateArray = new Uint8Array(updateBuffer);
        Y.applyUpdate(roomSession.ydoc, updateArray);
        
        // Broadcast the update payload to all other clients in the room
        socket.to(roomId).emit("yjs:update", updateBuffer);

        // Periodically persist the code states to storage (debounce/autosave behavior)
        saveRoomState(roomId, roomSession.ydoc);
      } catch (err) {
        console.error(`Error applying Yjs update in room ${roomId}:`, err);
      }
    });

    // Handle cursor position updates
    socket.on("cursor:update", (data) => {
      const user = roomSession.users.get(socket.id);
      if (user) {
        user.cursor = data;
        // Broadcast to other users
        socket.to(roomId).emit("cursor:update", {
          socketId: socket.id,
          username: user.username,
          color: user.color,
          cursor: data
        });
      }
    });

    // Handle chat messages
    socket.on("chat:send", async (msgData) => {
      const newMessage = {
        roomId,
        sender: msgData.sender,
        text: msgData.text,
        time: msgData.time,
        avatarColor: msgData.avatarColor || "bg-cyan-500",
        timestamp: new Date()
      };

      if (dbConnected) {
        const savedChat = new ChatModel(newMessage);
        await savedChat.save();
      } else {
        if (!memoryChats.has(roomId)) {
          memoryChats.set(roomId, []);
        }
        memoryChats.get(roomId).push(newMessage);
      }

      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit("chat:message", newMessage);
    });

    // Handle disconnect within connection context
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      
      const session = roomsState.get(roomId);
      if (session) {
        session.users.delete(socket.id);
        
        // If room is empty, clear in-memory session to save memory
        if (session.users.size === 0) {
          // Final save of document states
          saveRoomState(roomId, session.ydoc).then(() => {
            roomsState.delete(roomId);
            console.log(`[Server] Room ${roomId} inactive. Cleared session.`);
          });
        } else {
          // Broadcast updated user list
          const remainingUsers = Array.from(session.users.entries()).map(([sid, u]) => ({
            socketId: sid,
            username: u.username,
            color: u.color
          }));
          io.to(roomId).emit("room:users", remainingUsers);
          socket.to(roomId).emit("cursor:remove", { socketId: socket.id });
        }
      }
    });
  });
});

// Helper to save Yjs document state back to storage
async function saveRoomState(roomId, ydoc) {
  const yfiles = ydoc.getMap("files");
  const filesArray = [];

  yfiles.forEach((ytext, fileName) => {
    if (typeof fileName === "string" && ytext && typeof ytext.toString === "function") {
      filesArray.push({
        name: fileName,
        content: ytext.toString()
      });
    }
  });

  try {
    if (dbConnected) {
      await RoomModel.updateOne(
        { roomId },
        { files: filesArray }
      );
    } else {
      const room = memoryRooms.get(roomId);
      if (room) {
        room.files = filesArray;
      }
    }
  } catch (err) {
    console.error(`Failed to autosave room state for ${roomId}:`, err);
  }
}

// Start HTTP Server
httpServer.listen(PORT, () => {
  console.log(`[Server] DevSpace backend listening on port ${PORT}`);
});
