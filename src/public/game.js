import PlaySocket from "playsocketjs";
import { GamePhase } from "./phases";

export class Game {
  _subscribers = [];

  constructor() {
    // Create a new socket connection
    this.socket = new PlaySocket(null, {
        endpoint: `${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.host}/socket`
    });

    // Log all status events
    this.socket.onEvent("status", status => console.log(status));

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
  }

  async startGame() {
    await this.socket.sendRequest("startGame");
  }

  _setUpKnownSubscribers() {
    const roomCode = document.getElementById("room-code");
    this._subscribe("roomCode", "roomCode", (code) => roomCode.innerText = code);

    const players = document.getElementById("players");
    this._subscribe("players", "players", (playerList) => players.innerText = Object.values(playerList).join(', '));

    const lobbyScreen = document.getElementById("lobby")
    this._subscribe("phase", "phase", (phase) => {
      if (phase == GamePhase.INGAME) {
        lobbyScreen.classList.add("fade-out");
      } else {
        lobbyScreen.classList.remove("fade-out");
      }
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
