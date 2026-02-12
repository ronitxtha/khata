// frontend/src/socket.js
import { io } from "socket.io-client";

// URL of your backend server
const SOCKET_URL = "http://localhost:8000"; // use your server URL

// Create socket connection
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // optional, avoids polling fallback
});

// Optional: handle connection events
socket.on("connect", () => {
  console.log("Connected to Socket.IO server with ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server");
});

export default socket;
