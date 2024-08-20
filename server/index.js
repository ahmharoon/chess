const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const cors = require("cors");

const app = express();

const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("hello hi");
});

io.on("connect", (uniquesocket) => {
  console.log("connected", uniquesocket.id);

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", () => {
    console.log("disconnected");
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });
  uniquesocket.on("move", (move) => {
    try {
      console.log(chess.turn());
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        console.log("move made");
        currentPlayer = chess.turn();
        console.log(currentPlayer);
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move : ", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
