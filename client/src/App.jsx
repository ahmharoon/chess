import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import "./App.css";
import { useSocket } from "./context/SocketProvider";

function App() {
  const [board, setBoard] = useState([]);
  const [playerRole, setPlayerRole] = useState();
  const [currentPlayer, setCurrentPlayer] = useState("w"); // Initialize currentPlayer
  const [sourceSquare, setSourceSquare] = useState();
  const [draggedPiece, setDraggedPiece] = useState();
  const chess = new Chess();
  const socket = useSocket();

  useEffect(() => {
    setBoard(chess.board());

    socket.on("playerRole", (role) => {
      console.log("role", role);
      setPlayerRole(role);
      setBoard(chess.board());
    });

    socket.on("spectatorRole", () => {
      setPlayerRole(null);
      setBoard(chess.board());
    });

    socket.on("boardState", (fen) => {
      chess.load(fen);
      setBoard(chess.board());
    });

    socket.on("move", (move) => {
      chess.move(move);
      setBoard(chess.board());
      // Update currentPlayer after a move is made
      setCurrentPlayer(chess.turn());
      console.log("Updated turn:", chess.turn());
    });
    

    return () => {
      socket.disconnect();
      console.log("Disconnected from server");
    };
  }, [socket]);

  console.log("Current player:", currentPlayer);
  console.log("Player role:", playerRole);

  const getPieceUnicode = (piece) => {
    if (!piece) return null;
    const unicodePieces = {
      p: "♟︎",
      r: "♜",
      n: "♞",
      b: "♝",
      q: "♛",
      k: "♚",
      P: "♙",
      R: "♖",
      N: "♘",
      B: "♗",
      Q: "♕",
      K: "♔",
    };
    return piece.color === "w"
      ? unicodePieces[piece.type.toUpperCase()]
      : unicodePieces[piece.type];
  };

  const handleDragStart = (e, rowIndex, squareIndex) => {
    const square = board[rowIndex][squareIndex];
    console.log("Drag start:", square, "Player role:", playerRole, "Current player:", currentPlayer);

    if (square && square.color === currentPlayer) {
      setDraggedPiece(square);
      setSourceSquare({ row: rowIndex, col: squareIndex });
      e.dataTransfer.setData("text/plain", "");
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, rowIndex, squareIndex) => {
    e.preventDefault();
    if (draggedPiece) {
      const targetSquare = { row: rowIndex, col: squareIndex };

      // Move the piece in the chess logic
      const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${
          8 - sourceSquare.row
        }`,
        to: `${String.fromCharCode(97 + targetSquare.col)}${
          8 - targetSquare.row
        }`,
        promotion: "q",
      };


        setBoard(chess.board());
        socket.emit("move", move); // Emit the move to the server



      setDraggedPiece(null);
      setSourceSquare(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setSourceSquare(null);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-zinc-900">
      <div className="chessboard w-96 h-96 grid grid-cols-8 grid-rows-8">
        {board.map((row, rowIndex) =>
          row.map((square, squareIndex) => (
            <div
              key={`${rowIndex}-${squareIndex}`}
              className={`square flex justify-center items-center text-2xl ${
                (rowIndex + squareIndex) % 2 === 0
                  ? "light bg-gray-300"
                  : "dark bg-gray-800"
              }`}
              draggable={!!square && playerRole === currentPlayer && square.color === currentPlayer}
              onDragStart={(e) => handleDragStart(e, rowIndex, squareIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, rowIndex, squareIndex)}
              onDragEnd={handleDragEnd}
            >
              {getPieceUnicode(square)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
