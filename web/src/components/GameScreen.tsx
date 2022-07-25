import { useContext } from "react";
import { SocketContext } from "../socket";
import { GameInterface } from "../types";

interface Props {
  gameRoom: GameInterface;
}

export function GameScreen({ gameRoom }: Props) {
  const socket = useContext(SocketContext);
  const leaveGame = () => {
    socket.emit(
      "exitFromGame",
      JSON.stringify({
        gameId: gameRoom.gameId,
      })
    );
  };

  return (
    <div>
      <div>
        You are in a game room : {gameRoom.gameId} <br /> Total number of
        members in game : {gameRoom.clientIds.length}{" "}
      </div>
      <button onClick={leaveGame}>Leave Game</button>
    </div>
  );
}
