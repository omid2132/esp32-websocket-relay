const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 10000;

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let clients = new Set();

function broadcast(data, exclude = null) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws, req) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    try {
      const text = message.toString();
      console.log("Received:", text);

      // forward to everyone except sender
      broadcast(text, ws);
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
