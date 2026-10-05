import PlaySocket from "playsocketjs";

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

    // Update storage with newly joined player
    this.socket.onEvent("clientJoined", clientId => {
      if (this.socket.isHost) {
        this.socket.updateStorage("players", "array-add", clientId);
      }
    });

    // Remove disconnected player from storage
    this.socket.onEvent("clientLeft", clientId => {
      if (this.socket.isHost) {
        this.socket.updateStorage("players", "array-remove-matching", clientId);
      }
    });

    this._setUpKnownSubscribers();

    this.socket.init().then(id => {
      this.clientId = id;
    });
  }

  async createRoom() {
    try {
      const roomCode = await this.socket.createRoom();

      this.socket.updateStorage("roomCode", "set", roomCode);
      this.socket.updateStorage("players", "array-add", this.clientId);
      console.log(this.socket.clientId);
    } catch (ex) {
      console.error(ex);
    }
  }

  async joinRoom(roomCode) {
    try {
      await this.socket.joinRoom(roomCode);
    } catch (ex) {
      console.error(ex);
    }
  }

  async leaveRoom() {
    this.socket.destroy("leaving");

    await this.socket.init();
  }

  _setUpKnownSubscribers() {
    const roomCode = document.getElementById("room-code");
    this._subscribe("roomCode", "roomCode", (code) => roomCode.innerText = code);

    const players = document.getElementById("players");
    this._subscribe("players", "players", (playerList) => players.innerText = playerList.join(', '));
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
