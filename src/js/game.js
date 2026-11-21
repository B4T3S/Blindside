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

    //Init empty storage
    this.storage = {};

    // Update internal storage reference
    this.socket.onEvent("storageUpdated", async storage => {
      // Check which keys were updated and notify only those subscribers
      let updatedKeys = [];
      for(const [key, value] of Object.entries(storage)) {
        const oldValue = this.storage[key];

        if(!this._isEqual(oldValue, value)) {
          updatedKeys.push(key);
        }
      }
      this.storage = storage;

      updatedKeys.forEach(key => {
        this._updateSubscribers(key);
      });
    });

    this._setUpKnownSubscribers();

    this.socket.init().then(id => {
      this.clientId = id;
    });

    this.socket.onEvent("hostMigrated", () => this._toggleLobbySettings());

    this.turnOrderLength = 0;
  }

  async createRoom(username, mediaId) {
    try {
      const roomCode = await this.socket.createRoom();

      if(!!mediaId) {
        const mediaSelect = document.getElementById("media-select");
        mediaSelect.value = mediaId;
        mediaSelect.dispatchEvent(new Event("change"));
      }

      this.socket.updateStorage("roomCode", "set", roomCode);
      this.socket.updateStorage("phase", "set", GamePhase.LOBBY);
      await this.socket.sendRequest("initializePlayer", username);

      this._toggleLobbySettings();
    } catch (ex) {
      console.error(ex);
    }
  }

  async joinRoom(username, roomCode) {
    try {
      await this.socket.joinRoom(roomCode);
      await this.socket.sendRequest("initializePlayer", username);

      this._toggleLobbySettings();
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
    const media = document.getElementById("media-select").value;
    const category = document.getElementById("category-select").value;

    if (!media || !category) {
      console.error("Media or category not selected. Cannot start game.");
      return;
    }

    await this.socket.sendRequest("startGame", {
      "media": media,
      "category": category
    });

    this._resetCards();

    this.socket.sendRequest("startRound")
  }

  copyRoomCode() {
    const roomCode = document.getElementById("room-code");
    navigator.clipboard.writeText(roomCode.innerText);
    // TODO: display toast to indicate the room code was copied.
  }

  guessCorrect() {
    this.socket.sendRequest("guessCorrect");
  }

  guessIncorrect() {
    this.socket.sendRequest("guessIncorrect");
  }

  returnToLobby() {
    this.socket.sendRequest("lobbyReturn");
  }

  replay() {
    const winnerScreen = document.getElementById("winner-screen");
    this._resetCards();
    
    winnerScreen.hidden = true;

    this.socket.sendRequest("replay");
  }

  toggleGuessOptions() {
    const guessOptions = document.getElementById("guess-options");
    const currentTurnOrder = this.storage.turnList;
    guessOptions.hidden = !(currentTurnOrder.length > 0 && (this.clientId == currentTurnOrder[0]));
  }

  _resetCards() {
    const targetNames = document.querySelectorAll(".js-target-name");
    const images = document.querySelectorAll(".js-image");
    const playerNames = document.querySelectorAll(".js-player-name");

    targetNames.forEach(e => e.innerText = "Target Name");
    images.forEach(e => e.src = "");
    playerNames.forEach(e => e.innerText = "Player Name");
  }

  _setUpKnownSubscribers() {
    const roomCode = document.getElementById("room-code");
    this._subscribe("roomCode", "roomCode", (code) => roomCode.innerText = code);

    this._subscribe("players", "players", (playerList) => this._showPlayerNames(playerList, "players"));

    this._subscribe("turnList", "turnList", (turnList) => this._reRenderTurn(turnList));

    this._subscribe("phase", "phase", (phase) => {
      this._handlePhaseChange(phase);
    });
  }

  async _updateSubscribers(updatedKey) {
    const subscriber = this._subscribers.find(sub => sub.property == updatedKey);
    if (subscriber) {
      await subscriber.callback(this.storage[updatedKey]);
    }
  }

  _handlePhaseChange(phase) {
    const lobbyScreen = document.getElementById("lobby")
    const gameSelect = document.getElementById("game-select");

    const joinRoom = document.getElementById("join-room-button");
    const leaveRoom = document.getElementById("leave-room");

    const winnerScreen = document.getElementById("winner-screen");

    switch (phase) {
      case GamePhase.INGAME:
        lobbyScreen.classList.add("fade-out");
        gameSelect.classList.add("fade-out");
        joinRoom.hidden = true;
        leaveRoom.hidden = false;
        winnerScreen.hidden = true;
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

  _showPlayerNames(playerList, container) {
    const playerContainer = document.getElementById(container);
    playerContainer.innerHTML = "";

    const scoreSortedPlayerList = Object.values(playerList).sort((a, b) => b.score - a.score);

    for (const playerData of scoreSortedPlayerList) {
      const playerNameFrame = document.importNode(document.getElementById("player-name").content, true);
      playerNameFrame.querySelector(".name").innerText = playerData.username;
      playerNameFrame.querySelector(".score").innerText = playerData.score;
      playerContainer.append(playerNameFrame);
    }
  }

  _reRenderTurn(currentTurnOrder) {
    const playerContainer = document.getElementById("player-container");
    const guessOptions = document.getElementById("guess-options");
    const winnerScreen = document.getElementById("winner-screen");
    const playerData = this.storage.playerNames;

    // Set default hidden states
    if (playerContainer.hidden) {
      playerContainer.hidden = false;
    }
    winnerScreen.hidden = true;

    // Last player guess
    if (currentTurnOrder.length == 0) {
      playerContainer.hidden = true;
      guessOptions.hidden = true;


      const players = this.storage.players;
      this._showPlayerNames(players, "scoreboard-list");
      winnerScreen.hidden = false;

      if(this.socket.isHost) {
        const winnerScreenButtons = document.getElementById("winner-screen-buttons");
        winnerScreenButtons.hidden = false;
      }
      return;
    }

    // Handle card turning
    const event = new CustomEvent('revealCharacter', {
      bubbles: true,
      detail: {
        player: playerData[currentTurnOrder[0]],
        hidePlayer: this.clientId == currentTurnOrder[0],
        guessedCorrectly: this.turnOrderLength - 1 == currentTurnOrder.length
      }
    });

    playerContainer.dispatchEvent(event);

    // Hide guess options for all players and only unhide them in the revealedCharacter event
    guessOptions.hidden = true;

    this.turnOrderLength = currentTurnOrder.length;
  }

  _toggleLobbySettings() {
    const lobbySetting = document.getElementById("lobby-settings");
    lobbySetting.hidden = !this.socket.isHost;
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

  _isEqual(a, b) {
    if (a === b) return true;

    if (
      typeof a !== "object" ||
      typeof b !== "object" ||
      a === null ||
      b === null
    ) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key =>
      Object.hasOwn(b, key) && this._isEqual(a[key], b[key])
    );
  }
}
