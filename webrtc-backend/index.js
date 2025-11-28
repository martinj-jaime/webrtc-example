import { WebSocketServer } from "ws";

const socket = new WebSocketServer({
  port: 3000,
});

socket.on("connection", (ws) => {
  ws.on("message", async (message) => {
    socket.clients.forEach((client) => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message.toString());
      }
    });
  });
});
