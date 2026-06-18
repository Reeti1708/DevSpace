# DevSpace – Real-Time Developer Playground: Project Plan & Architecture Blueprint

This document outlines the architecture, data structures, and implementation plan for building **DevSpace**, a real-time collaborative coding platform. This plan is based on industry best practices for building collaborative Web applications and real-time syncing systems.

---

## 1. High-Level System Architecture

DevSpace will be structured as a decoupled full-stack application:

```
+-----------------------------------------------------------+
|                      CLIENT BROWSER                       |
|                                                           |
|  +-----------------------+     +-----------------------+  |
|  |     Client Tab 1      |     |     Client Tab 2      |  |
|  |   Next.js + Monaco    |     |   Next.js + Monaco    |  |
|  +-----------+-----------+     +-----------+-----------+  |
|              |                             |              |
|              +--------------+--------------+              |
|                             |                             |
|                             v (Iframe compilation)        |
|                  +--------------------+                   |
|                  |  Sandboxed Iframe  |                   |
|                  +--------------------+                   |
+-----------------------------|-----------------------------+
                              |
                              | Sockets (Socket.io protocol)
                              v
+-----------------------------------------------------------+
|                       BACKEND API                         |
|                                                           |
|          +-------------------------------------+          |
|          | Node.js + Express + Socket.io Server |          |
|          +------------------+------------------+          |
|                             |                             |
|                             v                             |
|                    +-----------------+                    |
|                    |     MongoDB     |                    |
|                    +-----------------+                    |
+-----------------------------------------------------------+
```

### Decoupled Stack Rationale
*   **Next.js Frontend (Port 3000):** Leverages App Router, React 19, and Tailwind CSS v4. Handles client routing, interactive state, Monaco editor lifecycle, local sandbox rendering, and Socket.io clients.
*   **Node.js/Express Backend (Port 5001):** A persistent Express server hosting the Socket.io WebSocket server. Running a separate server prevents Next.js hot-module reloading from resetting persistent socket connections during development, and scales efficiently in production.
*   **MongoDB (Database):** Used to persist room configurations, document codes, and chat histories.

---

## 2. Core Architectural Components & Best Practices

### A. Real-Time Code Synchronization (Yjs CRDTs)
*   **The Problem:** Synchronizing code by sending entire files or simple line diffs leads to race conditions, overwrite issues, and cursor jumping when multiple users type at once.
*   **Best Practice Solution:** Implement **Conflict-Free Replicated Data Types (CRDTs)** using **Yjs** (the leading open-source CRDT library).
    *   **Frontend Integration:** Use `@monaco-editor/react` to embed Monaco. Bind Monaco to Yjs using `y-monaco`.
    *   **Transport Layer:** Use a WebSocket/Socket.io adapter (such as `y-socket.io` or `y-websocket`) to propagate Yjs binary updates between clients and the server.
    *   **Workspace State:** Maintain three shared Yjs Text types: `html`, `css`, and `js`.

### B. Sandboxed Code Preview (HTML/CSS/JS)
*   **The Problem:** Executing untrusted user code (JavaScript/HTML) on the domain of the application opens the door to Cross-Site Scripting (XSS), session hijacking, and DOM manipulation.
*   **Best Practice Solution:** 
    1.  Use a sandboxed `<iframe>` with strict attributes: `sandbox="allow-scripts"`.
    2.  Do **NOT** use `allow-same-origin` on the iframe. This forces the iframe into a unique origin, blocking access to the host page's local storage, cookies, and document object.
    3.  **Compilation & Injection:** Compile the editor's HTML, CSS, and JS buffers into a single source document and render it in the iframe using the `srcDoc` attribute:
        ```html
        <!DOCTYPE html>
        <html>
          <head>
            <style>${cssCode}</style>
          </head>
          <body>
            ${htmlCode}
            <script>
              // Intercept console logs to display in client terminal
              const _log = console.log;
              console.log = (...args) => {
                _log(...args);
                window.parent.postMessage({ type: 'CONSOLE_LOG', content: args.join(' ') }, '*');
              };
              window.onerror = (message, source, lineno, colno, error) => {
                window.parent.postMessage({ type: 'CONSOLE_ERROR', content: message }, '*');
              };
              try {
                ${jsCode}
              } catch(e) {
                window.parent.postMessage({ type: 'CONSOLE_ERROR', content: e.message }, '*');
              }
            </script>
          </body>
        </html>
        ```

### C. Client-Side Presence (Cursors & Selection)
*   **Best Practice:** Users must see where other developers are typing in real-time.
*   **Solution:** Yjs contains a built-in `Awareness` module.
    *   The Monaco binding (`y-monaco`) reads user cursor positions and overlays dynamic selections with user-customized colors and cursor tags.
    *   This features requires zero custom canvas rendering and runs natively on Monaco's decoration engine.

---

## 3. Data Models (Database Schema)

We will use MongoDB to store persistent room configurations.

### `Room` Schema
```typescript
{
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // Binary state vector of Yjs document for room state persistence
  documentState: { type: Buffer, default: null }
}
```

### `ChatMessage` Schema
```typescript
{
  roomId: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}
```

---

## 4. Socket.io Protocol (Real-Time Messaging)

Clients and servers communicate via structured Socket.io events.

### Client-to-Server Events
*   `room:join({ roomId, username })`: Sent when a user enters a room. Adds socket to room `roomId` and registers username.
*   `chat:send({ roomId, sender, message })`: Sent when a client posts a message.
*   `cursor:update({ roomId, username, cursorOffset, selectionRange })`: Broadcasts presence if not using Yjs Awareness.
*   `yjs:update(updatePayload)`: Standard sync message passing binary Yjs updates.

### Server-to-Client Events
*   `room:users(usersList)`: Broadcasts updated list of active users in the room.
*   `chat:message(messageObject)`: Broadcasts new chat message to all room members.
*   `chat:history(messagesList)`: Sent immediately after joining to load history.
*   `yjs:update(updatePayload)`: Relays Yjs updates to sync the editor contents.

---

## 5. Step-by-Step Implementation Blueprint

### Step 1: Core Backend Setup (Express + Socket.io)
1.  Initialize a backend project in a `/server` directory.
2.  Install dependencies: `express`, `socket.io`, `mongoose`, `cors`, `dotenv`, `yjs`, `y-socket.io`.
3.  Configure server listener on port `5001` with CORS enabled for port `3000` (Next.js client).
4.  Configure database connection to MongoDB.
5.  Implement Socket.io server logic:
    *   Handle `room:join` and manage rooms state.
    *   Setup the Yjs socket provider (`y-socket.io`) to handle collaborative document synchronization.
    *   Store chat messages in MongoDB and broadcast using `io.to(roomId).emit('chat:message', ...)`.

### Step 2: Next.js Client Configuration & Pages Setup
1.  Configure routing:
    *   `/` (Landing page): Retain current landing page. Update the modal "Generate Room Workspace" button to hit the backend REST API (e.g. `POST /api/rooms`) to create a room ID, then route user to `/room/[roomId]`.
    *   `/room/[roomId]` (Active Room Page): Create a new dynamic route. Load components with `ssr: false` to avoid SSR mismatches with Monaco.
2.  Install client dependencies: `socket.io-client`, `yjs`, `@monaco-editor/react`, `y-monaco`.

### Step 3: Editor Layout & Monaco Collaboration Integration
1.  Build `/room/[roomId]/page.tsx` UI:
    *   Header: Room Name, Back Button, Invite Room Link Copy button, Theme Switcher, and User Presence List (avatars with tooltips).
    *   Main Workspace: Resizable panels (e.g., using `react-resizable-panels` or CSS Grid flex):
        *   Left Panel: Code Editor (tabs for HTML, CSS, JS).
        *   Right Panel (Split): Tab 1: Live Preview iframe, Tab 2: Terminal Console logs.
        *   Far Right Sidebar: Chat Room panel.
2.  Initialize Monaco Editor connected to Yjs:
    *   When the editor mounts, create a Yjs document `const ydoc = new Y.Doc()`.
    *   Create a Socket.io WebSocket connection provider.
    *   Connect Yjs Text structures (`ydoc.getText('html')`, `css`, `js`) to Monaco using `MonacoBinding`.
    *   Setup cursor presence using the provider's awareness.

### Step 4: Sandbox Preview & Logs Relayer
1.  Add state variables `htmlCode`, `cssCode`, `jsCode` updated from the editor state.
2.  Implement a compiler handler that debounces inputs (e.g., `500ms`) and updates the `srcDoc` of the `<iframe>`.
3.  Setup a message listener on the host page:
    *   Capture events of type `CONSOLE_LOG` and `CONSOLE_ERROR` coming from `iframe.contentWindow`.
    *   Append them to the "Terminal Console" state array so users can debug JS execution.

### Step 5: Chat System Integration
1.  Connect chat component to Socket.io.
2.  Listen for `chat:history` on mount to fill the chat panel.
3.  Listen for `chat:message` to append new messages in real-time.
4.  Emit `chat:send` when the user clicks the Send button.

---

## 6. Verification and Testing Checklist

- [ ] **Socket Connectivity:** Verify that launching the client establishes a successful handshake with the backend Socket.io server without CORS failures.
- [ ] **Real-Time Sync:** Open two separate browser tabs (one in incognito) on the same `/room/[roomId]` URL. Verify that writing code in tab A updates tab B instantly.
- [ ] **Cursor Presence:** Verify that moving the cursor in tab A displays a named color flag at the corresponding location in tab B.
- [ ] **Sandboxed Iframe:** Verify that custom JavaScript (e.g., `console.log("hello")`) executed in the editor preview prints in the custom terminal console, and executing malicious code (e.g. `window.parent.location`) is blocked by the iframe sandbox.
- [ ] **Chat Persistence:** Write a chat message, refresh the browser, and verify that the message persists (loaded from MongoDB).
- [ ] **Responsive Design:** Verify the layouts adjust correctly when resizing from standard Desktop resolutions down to Tablet and Mobile screens.
