import colors from "colors";
import { Server } from "socket.io";
import { logger } from "../shared/logger";

let ioInstance: Server | null = null;

const socket = (io: Server) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    logger.info(colors.blue("A user connected"));

    // App sends its logged-in userId right after connecting so server-side
    // code can push events to that specific user via emitToUser() below.
    socket.on("join-user", (userId: string) => {
      if (userId) {
        socket.join(userId);
      }
    });

    //disconnect
    socket.on("disconnect", () => {
      logger.info(colors.red("A user disconnect"));
    });
  });
};

// Push a live event to one user (all of their connected devices/tabs), e.g.
// a virtual card balance change. No-ops safely if socket.io hasn't started
// yet or the user has no active connection — callers never need to check.
const emitToUser = (userId: string, event: string, payload: unknown) => {
  ioInstance?.to(userId).emit(event, payload);
};

export const socketHelper = { socket, emitToUser };
