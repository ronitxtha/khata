// frontend/src/socket.js
import { io } from "socket.io-client";
import { API_BASE } from "./config/api.js";

// Socket connection uses the same backend URL as all API calls
const socket = io(API_BASE, {
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server with ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server");
});

export default socket;
