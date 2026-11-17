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

if (process.env.TRUST_PROXY == true) {
  app.set('trust proxy', 1);
}

// Set up session handling
app.use(session({
  store: new SQLiteStore({
    db: 'db/sessions.sqlite',
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
    case "initializePlayer":
      playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, {
        "username": data,
        "score": 0,
      });
      break;
    case "startGame":
      return startGame(roomId, data);
    case "startRound":
      startRound(roomId);
      break;
    case "replay":
      playSocketServer.updateRoomStorage(roomId, "playerNames", "set", await generateUserOptions(roomId));
      startRound(roomId);
      break;
    case "lobbyReturn":
      playSocketServer.updateRoomStorage(roomId, "phase", "set", GamePhase.LOBBY);
      break;
    case "guessCorrect":
      return guess(roomId, clientId, true);
    case "guessIncorrect":
      return guess(roomId, clientId, false);
  }
});

function guess(roomId, clientId, correct) {
  let turnList = playSocketServer.getRoomStorage(roomId).turnList;

  if (turnList[0] != clientId) {
    return "Player guessing out of turn!";
  }

  if (correct) {
    let player = playSocketServer.getRoomStorage(roomId).players[clientId];
    player.score += turnList.length;
    playSocketServer.updateRoomStorage(roomId, "players", "object-set-key", clientId, player);

    turnList.shift();
  } else {
    turnList.push(turnList.shift());
  }


  playSocketServer.updateRoomStorage(roomId, "turnList", "set", turnList);
}

async function startGame(roomId, data) {
  let turnList = playSocketServer.getRoomStorage(roomId).turnList;
  if (playSocketServer.getRoomStorage(roomId)?.phase == GamePhase.INGAME && turnList.length > 0) {
    return "Game already in progress!";
  }

  playSocketServer.updateRoomStorage(roomId, "phase", "set", GamePhase.INGAME);
  playSocketServer.updateRoomStorage(roomId, "media", "set", data.media);
  playSocketServer.updateRoomStorage(roomId, "category", "set", data.category);

  const playerNames = await generateUserOptions(roomId);
  console.log(playerNames);
  playSocketServer.updateRoomStorage(roomId, "playerNames", "set", playerNames);
}

function startRound(roomId, data) {
  const playerIds = Object.keys(playSocketServer.getRoomStorage(roomId).players);
  shuffleArray(playerIds)
  playSocketServer.updateRoomStorage(roomId, "turnList", "set", playerIds);
}

async function generateUserOptions(roomId) {
  const players = playSocketServer.getRoomStorage(roomId)?.players;
  const category = playSocketServer.getRoomStorage(roomId)?.category;

  return dbService.get_all_options(category).then((options) => {
    shuffleArray(options);

    if (!players) return;

    var playerNames = {};

    for (const [id, playerData] of Object.entries(players)) {
      const option = options.pop();
      playerNames[id] = {
          "target": option.name,
          "image": option.icon_url,
          "playerName": playerData.username,
        }
    }

    return playerNames;
  });
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
