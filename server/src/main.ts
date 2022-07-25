import express from "express";
import cuid from "cuid";
import { Server } from "socket.io";
import { createServer } from "http";
import { config } from "dotenv";
config();

const port = process.env.PORT;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

interface GameInterface {
  gameId: string;
  clientIds: string[];
}

let currentGames: Array<GameInterface> = [];

io.on("connection", (socket) => {
  // add code to create new game
  console.log("new connection", socket.id);
  socket.on("message", (body) => {
    console.log("pinged", body);
    console.log(socket.rooms);
  });
  socket.on("createGame", (body: string) => {
    try {
      const { clientId } = JSON.parse(body);
      const payload = createNewGame(clientId);
      socket.join(payload.gameId);
      socket.emit("game", JSON.stringify(payload));
    } catch (err) {
      throw new Error(err);
    }
  });

  socket.on("exitFromGame", (body: string) => {
    try {
      const { gameId } = JSON.parse(body);
      const returnData = currentGames.findIndex((v) => v.gameId === gameId);
      removeUserFromGame({ clientId: socket.id });
      socket.emit(
        "removedParticipant",
        JSON.stringify(currentGames[returnData])
      );
      socket
        .to(gameId)
        .emit("removedParticipant", JSON.stringify(currentGames[returnData]));
    } catch (err) {
      throw new Error(err);
    }
  });
  socket.on("joinExistingGame", (body: string) => {
    try {
      const { clientId, gameId } = JSON.parse(body);
      const payload = addUserToExistingGame({
        clientId: clientId,
        gameId: gameId,
      });
      socket.join(gameId);
      socket.emit("newParticipant", JSON.stringify(payload));
      socket.to(gameId).emit("newParticipant", JSON.stringify(payload));
    } catch (err) {
      console.error(err);
      socket.emit("error", err.message);
    }
  });
  socket.on("disconnect", () => {
    // Not a good method but works for now

    const games = currentGames.map(({ gameId, clientIds }) =>
      // Check in which games user exists
      {
        if (clientIds.includes(socket.id)) {
          const payload = {
            gameId: gameId,
            clientIds: clientIds.filter((v) => v !== socket.id),
          };
          socket.to(gameId).emit("removedParticipant", JSON.stringify(payload));
          return payload;
        }
        return {
          gameId,
          clientIds,
        };
      }
    );
    currentGames = games;
    console.log("user disconnected successfully");
  });
});

function removeUserFromGame({ clientId }: { clientId: string }) {
  const games = currentGames.map(({ gameId, clientIds }) =>
    // Check in which games user exists
    {
      if (clientIds.includes(clientId)) {
        const payload = {
          gameId: gameId,
          clientIds: clientIds.filter((v) => v !== clientId),
        };
        return payload;
      }
      return {
        gameId,
        clientIds,
      };
    }
  );
  currentGames = games;
  return currentGames;
}

function addUserToExistingGame({
  clientId,
  gameId,
}: {
  clientId: string;
  gameId: string;
}) {
  const gameIndex = currentGames.findIndex((v) => v.gameId === gameId);
  if (currentGames[gameIndex].clientIds.includes(clientId)) {
    throw new Error("Participant already exists");
  }
  if (currentGames[gameIndex].clientIds.length === 2) {
    throw new Error("Cannot add more participants");
  }
  currentGames[gameIndex].clientIds.push(clientId);
  return currentGames[gameIndex];
}

function createNewGame(clientId: string) {
  const gameId = cuid();
  const payload = { gameId, clientIds: [clientId] };
  currentGames.push(payload);
  return payload;
}

server.listen(port, () => {
  console.log("Listening on port : ", port);
});
