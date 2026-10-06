import express from "express";
import http from "node:http";
import PlaySocketServer from "playsocketjs/server";
import { GamePhase } from './public/phases.js'

const app = express();
const httpServer = http.createServer(app);

// Serve public folder
app.use(express.static('src/public'));

// Create PlaySocket server with existing HTTP server
const playSocketServer = new PlaySocketServer({
  server: httpServer,
  path: "/socket"
});

// Manage usernames
playSocketServer.onEvent("requestReceived", async ({ roomId, clientId, name, data }) => {
  if (name === "setUsername") {
    playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, data);
  }

  if (name === "startGame") {
    if (playSocketServer.getRoomStorage(roomId)?.phase !== GamePhase.INGAME) {
      playSocketServer.updateRoomStorage(roomId, "phase", "set", GamePhase.INGAME);
    } else {
      return "Game already in progress!";
    }
  }
});

// Remove players from the lobby if they leave
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

// Clean up on shutdown
function shutdown() {
    playSocketServer.stop(); // Gracefully disconnect clients
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
