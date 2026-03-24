import { Server } from 'socket.io';
import { corsOptions } from './cors.js';
import { verifyJWT } from '#shared/utils/jwt.js';
import { getAllAdmins } from '#modules/users/index.js';

export class CustomSocket {
  static #io = null;
  static #onlineUsers = new Map(); // key value => userId => new Set('socket1',`socket2`);

  // Initialize socket server
  static initialize(server) {
    if (!server) throw new Error('No Server Provided');
    if (this.#io) return; // Already initialized

    this.#io = new Server(server, { cors: corsOptions });

    this.#io.on('connection', (socket) => {
      console.log('Socket connected: ', socket.id);

      // Authenticate user
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.log('Guest connection, no token');
        socket.userId = null; // Optional: treat as guest
      } else {
        const payload = verifyJWT(token);
        if (!payload) {
          console.log('Invalid token, disconnecting socket', socket.id);
          socket.disconnect();
          return;
        }

        socket.userId = payload.id;

        console.log(socket.userId);

        // Add socket.id to online users map
        if (!this.#onlineUsers.has(socket.userId)) {
          this.#onlineUsers.set(socket.userId, new Set());
        }
        this.#onlineUsers.get(socket.userId).add(socket.id);
      }

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);

        if (socket.userId && this.#onlineUsers.has(socket.userId)) {
          const userSockets = this.#onlineUsers.get(socket.userId);
          userSockets.delete(socket.id);

          // Remove userId from map if no sockets left
          if (userSockets.size === 0) {
            this.#onlineUsers.delete(socket.userId);
          }
        }
      });
    });
  }

  // Get io instance
  static getIO() {
    if (!this.#io) throw new Error('Socket is not initialized');
    return this.#io;
  }

  // Get online users map
  static getOnlineUsers() {
    return this.#onlineUsers;
  }

  static emitToUser(userId, event, payload) {
    if (!this.#io) throw new Error('Socket is not initialized');

    const sockets = this.#onlineUsers.get(userId);
    if (!sockets || sockets.size === 0) return;

    for (const socketId of sockets) {
      this.#io.to(socketId).emit(event, payload);
    }
  }

  static async emitToAdmins(event, payload) {
    const admins = await getAllAdmins();

    for (const admin of admins) {
      const adminId = admin._id.toString();
      this.emitToUser(adminId, event, payload);
    }
  }
}
