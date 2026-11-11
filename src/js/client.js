import { Game } from "./game.js";
import { Application } from "@hotwired/stimulus";
import { LobbyController } from "./stimulus/lobbyController.js";

window.Stimulus = Application.start();
Stimulus.register("lobby", LobbyController);

const game = new Game();

const username = document.getElementById("lobby-username");

const createRoom = document.getElementById("create-room");
createRoom.addEventListener("click", () => game.createRoom(username.value));

const leaveRoom = document.getElementById("leave-room");
leaveRoom.addEventListener("click", () => game.leaveRoom());

const joinRoom = document.getElementById("join-game");
const joinRoomCode = document.getElementById("join-room-code");
const joinRoomUsername = document.getElementById("join-room-username");
joinRoom.addEventListener("click", () => game.joinRoom(joinRoomUsername.value, joinRoomCode.value));

const startGame = document.getElementById("start-game");
startGame.addEventListener("click", () => game.startGame());

const copyRoomCode = document.getElementById("copy-lobby-code");
copyRoomCode.addEventListener("click", () => game.copyRoomCode());

const guessCorrect = document.getElementById("guess-correct");
guessCorrect.addEventListener("click", () => game.guessCorrect());
const guessIncorrect = document.getElementById("guess-incorrect");
guessIncorrect.addEventListener("click", () => game.guessIncorrect());
