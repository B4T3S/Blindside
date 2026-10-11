import express from "express";
import http from "node:http";
import PlaySocketServer from "playsocketjs/server";
import { GamePhase } from '../public/phases.js'
import { DatabaseService } from "./service/database_service.js";
import { createAdminRouter } from "./routes/admin.js";
import session from "express-session";
import connectSqlite3 from 'connect-sqlite3';

const app = express();
const dbService = new DatabaseService();
const httpServer = http.createServer(app);
const SQLiteStore = connectSqlite3(session);

// Set up session handling
app.use(session({
  store: new SQLiteStore({
    db: 'database.sqlite',
    dir: './src/backend',
    table: 'sessions'
  }),
  name: 'admin.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Register protected routes
app.use('/admin', createAdminRouter(dbService));

// Serve public folder
app.use(express.static('src/public'));

// Create PlaySocket server with existing HTTP server
const playSocketServer = new PlaySocketServer({
  server: httpServer,
  path: "/socket"
});

// Manage events
playSocketServer.onEvent("requestReceived", async ({ roomId, clientId, name, data }) => {
  switch (name) {
    case "setUsername":
      playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, data);
      break;
    case "startGame":
      if (playSocketServer.getRoomStorage(roomId)?.phase !== GamePhase.INGAME) {
        playSocketServer.updateRoomStorage(roomId, "phase", "set", GamePhase.INGAME);
      } else {
        return "Game already in progress!";
      }
      break;
    case "startRound":
      playSocketServer.updateRoomStorage(roomId, "playerNames", "set", generateUsernames(roomId));
      break;
  }
});

function generateUsernames(roomId) {
  const players = playSocketServer.getRoomStorage(roomId)?.players;
  // TODO: Find better way to store names/images etc.
  let namePool = ["Vindicta", "The Lash", "Beebop", "The Doorman"];
  shuffleArray(namePool);

  if (!players) return;

  var playerNames = {};

  for (const [id, name] of Object.entries(players)) {
    playerNames[id] = {
        "target": namePool.pop(),
        "playerName": name
      }
  }

  return playerNames;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

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
