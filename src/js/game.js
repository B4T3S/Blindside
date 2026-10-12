import PlaySocket from "playsocketjs";
import { GamePhase } from "./enums.js";

export class Game {
  _subscribers = [];

  constructor() {
    // Create a new socket connection

    console.log('Initializing PlaySocket client');

    this.socket = new PlaySocket(null, {
        endpoint: `${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.host}/socket`
    });

    console.log('PlaySocket client initialized');

    // Log all status events
    this.socket.onEvent("status", status => console.log(`Status updated: ${status}`));

    // Update internal storage reference
    this.socket.onEvent("storageUpdated", async storage => {
      this.storage = storage;

      await this._updateSubscribers();
    });

    this._setUpKnownSubscribers();

    this.socket.init().then(id => {
      this.clientId = id;
    });
  }

  async createRoom(username) {
    try {
      const roomCode = await this.socket.createRoom();

      this.socket.updateStorage("roomCode", "set", roomCode);
      this.socket.updateStorage("phase", "set", GamePhase.LOBBY);
      await this.socket.sendRequest("setUsername", username);
    } catch (ex) {
      console.error(ex);
    }
  }

  async joinRoom(username, roomCode) {
    try {
      await this.socket.joinRoom(roomCode);
      await this.socket.sendRequest("setUsername", username);
    } catch (ex) {
      console.error(ex);
    }
  }

  async leaveRoom() {
    this.socket.destroy("leaving");

    await this.socket.init();

    this._handlePhaseChange(GamePhase.PREGAME);
  }

  async startGame() {
    await this.socket.sendRequest("startGame");

    setTimeout(async () => await this.socket.sendRequest("startRound"), 3000);
  }

  _setUpKnownSubscribers() {
    const roomCode = document.getElementById("room-code");
    this._subscribe("roomCode", "roomCode", (code) => roomCode.innerText = code);
    
    this._subscribe("players", "players", (playerList) => this._showPlayerNames(playerList));

    this._subscribe("playerNames", "playerNames", (playerData) => this._showPlayerFrames(playerData));

    this._subscribe("phase", "phase", (phase) => {
      this._handlePhaseChange(phase);
    });
  }

  async _updateSubscribers() {
    for (const [key, value] of Object.entries(this.storage)) {
      const subscriber = this._subscribers.find(sub => sub.property == key);
      if (subscriber) {
        await subscriber.callback(value);
      }
    }
  }

  _handlePhaseChange(phase) {
    const lobbyScreen = document.getElementById("lobby")
    const gameSelect = document.getElementById("game-select");

    const joinRoom = document.getElementById("join-room-button");
    const leaveRoom = document.getElementById("leave-room");

    const playerContainer = document.getElementById("player-container");

    switch (phase) {
      case GamePhase.INGAME:
        lobbyScreen.classList.add("fade-out");
        gameSelect.classList.add("fade-out");
        joinRoom.hidden = true;
        leaveRoom.hidden = false;
        playerContainer.innerHTML = "";
        break;
      case GamePhase.LOBBY:
        lobbyScreen.classList.remove("fade-out");
        gameSelect.classList.add("fade-out");
        joinRoom.hidden = true;
        leaveRoom.hidden = false;
        break;
      default:
        lobbyScreen.classList.remove("fade-out");
        gameSelect.classList.remove("fade-out");
        joinRoom.hidden = false;
        leaveRoom.hidden = true;
        break;
    }
  }
  
  _showPlayerNames(playerList) {
    const playerContainer = document.getElementById("players");
    playerContainer.innerHTML = "";
    
    for (const playerName of Object.values(playerList)) {
      const playerNameFrame = document.importNode(document.getElementById("player-name").content, true);
      playerNameFrame.querySelector("li").innerText = playerName;
      playerContainer.append(playerNameFrame);
    }
  }

  _showPlayerFrames(playerData) {
    const playerContainer = document.getElementById("player-container");

    for (const [id, data] of Object.entries(playerData)) {
      const playerNode = document.importNode(document.getElementById("player-frame").content, true);
      const isOwnCharacter = id == this.clientId;

      playerNode.querySelector("h1").innerText = isOwnCharacter ? "???" : data["target"];
      playerNode.querySelector("h2").innerText = data["playerName"];

      playerContainer.appendChild(playerNode);
    }
  }

  _subscribe(elementId, property, callback) {
    this._subscribers.push({
      "elementId": elementId,
      "property": property,
      "callback": callback
    });
  }

  _unsubscribe(elementId) {
    const index = this._subscribers.findIndex(entry => entry.elementId == elementId);

    if (index) {
      this._subscribers.splice(index, 1);
    }
  }
}
