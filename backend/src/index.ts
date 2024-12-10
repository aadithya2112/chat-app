import express from "express";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { connectToDB, UserModel } from "./db";
import dotenv from "dotenv";
import { authMiddleware, NewRequest } from "./authMiddleware";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

const app = express();
app.use(express.json());

connectToDB();

const rooms: Record<string, { creator: string; clients: WebSocket[] }> = {};

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    await UserModel.create({ username, password });
    const token = jwt.sign({ username }, JWT_SECRET);
    res.status(200).send({ status: "success", token });
  } catch (error) {
    res
      .status(400)
      .send({ status: "failed", message: "Username already exists" });
  }
});

app.post("/api/create-room", authMiddleware, (req: NewRequest, res) => {
  const { roomName } = req.body;
  const creator = req.user;
  const roomExists = roomName in rooms;

  if (roomExists) {
    res.send({ status: "failed", message: "RoomName already exists" });
  } else {
    rooms[roomName] = { creator, clients: [] };
    res.status(201).send({
      status: "success",
      message: "Room created successfully",
      roomName,
    });
  }
});

app.get("/api/rooms", authMiddleware, (req: NewRequest, res) => {
  const allRooms = Object.keys(rooms);
  res.send(allRooms);
});

app.post("/api/join-room", authMiddleware, (req: NewRequest, res) => {
  const { roomId, username } = req.body;
  const roomExists = roomId in rooms;

  if (roomExists) {
    rooms[roomId].clients.push(username);
    res.send({
      status: "success",
      message: "Joined room successfully",
      roomId,
    });
  } else {
    res.send({ status: "failed", message: "Room does not exist" });
  }
});

const httpServer = app.listen(3000, () => {
  console.log("HTTP server running on port 3000");
});

const wss = new WebSocketServer({ server: httpServer });

const broadcastToRoom = (roomName: string, message: string) => {
  rooms[roomName].clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on("connection", (ws) => {
  console.log("A new WebSocket connection established");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (err) {
      console.error("Invalid JSON message received:", message);
      ws.send(
        JSON.stringify({
          status: "failed",
          message: "Invalid message format",
        })
      );
      return;
    }

    if (data.type === "join-room") {
      const { roomName, username } = data;

      if (!rooms[roomName]) {
        ws.send(
          JSON.stringify({
            status: "failed",
            message: "Room does not exist",
          })
        );
        return;
      }

      rooms[roomName].clients.push(ws);

      broadcastToRoom(
        roomName,
        JSON.stringify({
          type: "system",
          message: `${username} has joined the room`,
        })
      );

      ws.send(
        JSON.stringify({
          status: "success",
          message: "Joined room successfully",
        })
      );
    }

    if (data.type === "chat") {
      const { roomName, username, message } = data;

      if (!rooms[roomName]) {
        ws.send(
          JSON.stringify({
            status: "failed",
            message: "Room does not exist",
          })
        );
        return;
      }

      broadcastToRoom(
        roomName,
        JSON.stringify({
          type: "chat",
          username,
          message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");

    // Cleanup when the connection is closed
    Object.keys(rooms).forEach((roomName) => {
      const room = rooms[roomName];
      const index = room.clients.indexOf(ws);
      if (index !== -1) {
        room.clients.splice(index, 1);
      }
    });
  });
});
