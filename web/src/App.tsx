import { useEffect, useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { socket, SocketContext } from "./socket";
import { GameInterface } from "./types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [currentGame, setCurrentGame] = useState<null | GameInterface>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const createGame = () => {
    socket.emit(
      "createGame",
      JSON.stringify({
        clientId: socket.id,
      })
    );
  };

  const joinGame = () => {
    socket.emit(
      "joinExistingGame",
      JSON.stringify({
        clientId: socket.id,
        gameId: gameId,
      })
    );
  };

  const updateGameState = (body: string) => {
    const gameData = JSON.parse(body);
    setCurrentGame(gameData);
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connection established!!");
    });

    socket.on("error", (error) => {
      console.log(error);
      toast(`Error : ${error}`, {
        theme: "colored",
        type: "error",
      });
    });

    socket.on("disconnect", () => {
      setCurrentGame(null);
      console.log("disconnected from sever !!");
    });

    socket.on("removedParticipant", updateGameState);
    socket.on("newParticipant", updateGameState);
    socket.on("game", updateGameState);
    return () => {
      socket.off("connect");
      socket.off("error");
      socket.off("disconnect");
      socket.off("game");
      socket.off("removedParticipant");
      socket.off("newParticipant");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <div>
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
            <button type="button" onClick={createGame}>
              Create New Game
            </button>

            <div>
              <input
                onChange={(e) => {
                  setGameId(e.target.value);
                }}
              />
              <br />
              <button type="button" onClick={joinGame}>
                Join Game
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </SocketContext.Provider>
  );
}

export default App;
