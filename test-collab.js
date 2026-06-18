const { io } = require("socket.io-client");
const Y = require("yjs");

async function runTest() {
  console.log("Starting E2E Collaboration Test...");
  const BACKEND_URL = "http://localhost:5001";
  const roomId = "test-room-" + Math.random().toString(36).substring(2, 8);

  const socket1 = io(BACKEND_URL);
  const socket2 = io(BACKEND_URL);

  let presenceVerified = false;
  let yjsSynced = false;
  let chatSynced = false;

  // Local Yjs documents
  const doc1 = new Y.Doc();
  const doc2 = new Y.Doc();

  const files1 = doc1.getMap("files");
  const files2 = doc2.getMap("files");

  // Track updates on Client 2
  files2.observeDeep(() => {
    const htmlFile2 = files2.get("index.html");
    if (htmlFile2) {
      const content = htmlFile2.toString();
      console.log("[Test] Client 2 index.html content:", content);
      if (content.includes("Hello from Alice!")) {
        yjsSynced = true;
      }
    }
  });

  // Connect socket 1
  socket1.on("connect", () => {
    console.log("[Test] Client 1 (Alice) connected.");
    socket1.emit("room:join", {
      roomId,
      username: "Alice",
      color: "#00f0ff"
    });
  });

  // Connect socket 2
  socket2.on("connect", () => {
    console.log("[Test] Client 2 (Bob) connected.");
    socket2.emit("room:join", {
      roomId,
      username: "Bob",
      color: "#a855f7"
    });
  });

  // Client 1 receives yjs:init
  socket1.on("yjs:init", (initBuffer) => {
    console.log("[Test] Client 1 received yjs:init.");
    const updateArray = new Uint8Array(initBuffer);
    Y.applyUpdate(doc1, updateArray);
  });

  socket1.on("yjs:update", (updateBuffer) => {
    const updateArray = new Uint8Array(updateBuffer);
    Y.applyUpdate(doc1, updateArray);
  });

  // Client 2 receives yjs:init
  socket2.on("yjs:init", (initBuffer) => {
    console.log("[Test] Client 2 received yjs:init.");
    const updateArray = new Uint8Array(initBuffer);
    Y.applyUpdate(doc2, updateArray);
  });

  // Client 2 receives yjs:update
  socket2.on("yjs:update", (updateBuffer) => {
    console.log("[Test] Client 2 received yjs:update.");
    const updateArray = new Uint8Array(updateBuffer);
    Y.applyUpdate(doc2, updateArray);
  });

  // Monitor presence
  socket1.on("room:users", (users) => {
    console.log("[Test] Client 1 received room users:", users.map(u => u.username));
    if (users.some(u => u.username === "Alice") && users.some(u => u.username === "Bob")) {
      presenceVerified = true;
    }
  });

  // Listen for chat message on Client 2
  socket2.on("chat:message", (msg) => {
    console.log("[Test] Client 2 received chat message:", msg);
    if (msg.sender === "Alice" && msg.text === "Hi Bob!") {
      chatSynced = true;
    }
  });

  // Perform testing sequence
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Perform Yjs change from Client 1
  console.log("[Test] Alice typing in index.html...");
  const htmlFile1 = files1.get("index.html");
  if (htmlFile1) {
    htmlFile1.insert(0, "Hello from Alice! ");
    const stateUpdate = Y.encodeStateAsUpdate(doc1);
    socket1.emit("yjs:update", stateUpdate.buffer);
  } else {
    console.error("[Test] index.html not found in Client 1 Yjs files map.");
  }

  // Send Chat message from Client 1
  console.log("[Test] Alice sending chat message: 'Hi Bob!'");
  socket1.emit("chat:send", {
    sender: "Alice",
    text: "Hi Bob!",
    time: "12:00",
    avatarColor: "#00f0ff"
  });

  // Wait for sync to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Assertions
  console.log("\n--- TEST RESULTS ---");
  console.log(`Presence Sync Verified: ${presenceVerified ? "PASSED" : "FAILED"}`);
  console.log(`Yjs Code Sync Verified: ${yjsSynced ? "PASSED" : "FAILED"}`);
  console.log(`Chat Sync Verified: ${chatSynced ? "PASSED" : "FAILED"}`);
  console.log("--------------------\n");

  socket1.disconnect();
  socket2.disconnect();

  if (presenceVerified && yjsSynced && chatSynced) {
    console.log("All E2E checks passed successfully!");
    process.exit(0);
  } else {
    console.error("Some E2E checks failed.");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
