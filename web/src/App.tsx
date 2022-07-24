import { useEffect, useState } from "react";
import socket from "./socket";
interface GameInterface {
  gameId: string;
  clientIds: string;
}

function App() {
  const [currentGame, setCurrentGame] = useState<null | GameInterface>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connection established!!");
    });

    socket.on("disconnect", () => {
      setCurrentGame(null);
      console.log("disconnected from sever !!");
    });

    socket.on("removedParticipant", (body: string) => {
      const gameData = JSON.parse(body);
      console.log("removed user from game", gameData);
      setCurrentGame(gameData);
    });

    socket.on("newParticipant", (body: string) => {
      const gameData = JSON.parse(body);
      setCurrentGame(gameData);
      console.log("Added new user to game", gameData);
    });
    socket.on("game", (body: string) => {
      const gameData = JSON.parse(body);
      setCurrentGame(gameData);
      console.log("new game created", gameData);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("game");
      socket.off("removedParticipant");
      socket.off("newParticipant");
    };
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          socket.disconnect();
        }}
      >
        Disconnect
      </button>
      <button
        type="button"
        onClick={() => {
          socket.emit("message", "Hi");
        }}
      >
        Ping Server
      </button>
      {currentGame !== null && currentGame.clientIds.includes(socket.id) ? (
        <GameScreen gameRoom={currentGame} />
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              socket.emit(
                "createGame",
                JSON.stringify({
                  clientId: socket.id,
                })
              );
            }}
          >
            Create New Game
          </button>

          <div>
            <input
              onChange={(e) => {
                setGameId(e.target.value);
              }}
            />
            <br />
            <button
              type="button"
              onClick={() => {
                socket.emit(
                  "joinExistingGame",
                  JSON.stringify({
                    clientId: socket.id,
                    gameId: gameId,
                  })
                );
              }}
            >
              Join Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GameScreen({ gameRoom }: { gameRoom: GameInterface }) {
  return (
    <div>
      <div>
        You are in a game room : {gameRoom.gameId} <br /> Total number of
        members in game : {gameRoom.clientIds.length}{" "}
      </div>
      <button
        onClick={() => {
          socket.emit(
            "exitFromGame",
            JSON.stringify({
              gameId: gameRoom.gameId,
            })
          );
        }}
      >
        Leave Game
      </button>
    </div>
  );
}

export default App;
