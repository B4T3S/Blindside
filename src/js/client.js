import { Game } from "./game.js";

const game = new Game();

const username = document.getElementById("lobby-username");

const createRoom = document.getElementById("create-room");
createRoom.addEventListener("click", async () => await game.createRoom(username.value));

const leaveRoom = document.getElementById("leave-room");
leaveRoom.addEventListener("click", async () => await game.leaveRoom());

const joinRoom = document.getElementById("join-game");
const joinRoomCode = document.getElementById("join-room-code");
const joinRoomUsername = document.getElementById("join-room-username");
joinRoom.addEventListener("click", async () => await game.joinRoom(joinRoomUsername.value, joinRoomCode.value));

const startGame = document.getElementById("start-game");
startGame.addEventListener("click", async () => await game.startGame());
