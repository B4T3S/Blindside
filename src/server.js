import express from "express";
import http from "node:http";
import PlaySocketServer from "playsocketjs/server";

const app = express();
const httpServer = http.createServer(app);

// Serve public folder
app.use(express.static('src/public'));

// Create PlaySocket server with existing HTTP server
const playSocketServer = new PlaySocketServer({
  server: httpServer,
  path: "/socket"
});

playSocketServer.onEvent("requestReceived", async ({ roomId, clientId, name, data }) => {
  if (name === "setUsername") {
    playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, data);
  }
});

playSocketServer.onEvent("clientDisconnected", async (clientId, roomId) => {
  playSocketServer.updateRoomStorage(roomId, "players", "object-remove-key", clientId);
});

playSocketServer.onEvent("clientLeftRoom", async (clientId, roomId) => {
  playSocketServer.updateRoomStorage(roomId, "players", "object-remove-key", clientId);
});

// Start the server
httpServer.listen(3000, () => {
  console.log("Server running on port 3000.");
});

function shutdown() {
    playSocketServer.stop(); // Gracefully disconnect clients
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
