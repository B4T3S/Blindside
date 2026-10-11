const websocket = new WebSocket('http://localhost:3001/hot-reload');
websocket.onmessage = () => {
  window.setTimeout(() => {
    window.location.reload();
  }, 500)
};
