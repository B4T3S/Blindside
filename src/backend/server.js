import express from "express";
import http from "node:http";
import PlaySocketServer from "playsocketjs/server";
import { GamePhase } from '../../static/js/enums.js'
import { DatabaseService } from "./service/database_service.js";
import { createAdminRouter } from "./routes/admin.js";
import session from "express-session";
import connectSqlite3 from 'connect-sqlite3';
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const dbService = new DatabaseService();
const httpServer = http.createServer(app);
const SQLiteStore = connectSqlite3(session);

const hotReload = process.env.NODE_ENV !== 'production';
let reloadWss = null;

// Set view engine
app.set('view engine', 'twig');

// Set up session handling
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './',
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
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Register protected routes
app.use('/admin', createAdminRouter(dbService));

// Serve static folder
app.use('/static', express.static('./static'));

// Get Media
app.get("/api/media", async (req, res) => {
  const games = await dbService.get_all_media();
  res.json({ "media": games })
});

// Get categories
app.get("/api/categories/:mediaId", async (req, res) => {
  const mediaId = req.params.mediaId;
  res.json(await dbService.get_all_categories(mediaId));
});

// Get options
app.get("/api/options/:categoryId", async (req, res) => {
  const categoryId = req.params.categoryId;
  res.json(await dbService.get_all_options(categoryId));
})

// Serve base route
app.get('/', (req, res) => {
  res.render('index.html.twig', { hotReload });
});

// Create PlaySocket server with existing HTTP server
const playSocketServer = new PlaySocketServer({
  server: httpServer,
  path: "/socket"
});

if (hotReload) {
  reloadWss = new WebSocketServer({
    port: 3001,
    path: '/hot-reload'
  });
}

// Manage events
playSocketServer.onEvent("requestReceived", async ({ roomId, clientId, name, data }) => {
  switch (name) {
    case "setUsername":
      playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, data);
      break;
    case "startGame":
      if (playSocketServer.getRoomStorage(roomId)?.phase !== GamePhase.INGAME) {
        playSocketServer.updateRoomStorage(roomId, "phase", "set", GamePhase.INGAME);
        playSocketServer.updateRoomStorage(roomId, "media", "set", data.media);
        playSocketServer.updateRoomStorage(roomId, "category", "set", data.category);
      } else {
        return "Game already in progress!";
      }
      break;
    case "startRound":
      playSocketServer.updateRoomStorage(roomId, "playerNames", "set", await generateUsernames(roomId));
      break;
  }
});

async function generateUsernames(roomId) {
  const players = playSocketServer.getRoomStorage(roomId)?.players;
  const category = playSocketServer.getRoomStorage(roomId)?.category;

  let options = await dbService.get_all_options(category);
  shuffleArray(options);

  if (!players) return;

  var playerNames = {};

  for (const [id, name] of Object.entries(players)) {
    const option = options.pop();
    playerNames[id] = {
        "target": option.name,
        "image": option.icon_url,
        "playerName": name,
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
  console.log("Received SIGINT/SIGTERM. Shutting down server.");
  if (hotReload && reloadWss != null) {
    console.log("Environment is not production! Triggering hot-reload!");

    reloadWss.clients.forEach(client => {
      if (client !== reloadWss && client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  }
  playSocketServer.stop(); // Gracefully disconnect clients
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
