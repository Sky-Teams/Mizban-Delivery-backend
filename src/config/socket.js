import { Server } from 'socket.io';
import { corsOptions } from './cors.js';
import { verifyJWT } from '#shared/utils/jwt.js';

export class CustomSocket {
  static #io = null;

  // Initialize socket server
  static initialize(server) {
    if (!server) throw new Error('No Server Provided');
    if (this.#io) return; // Already initialized

    this.#io = new Server(server, { cors: corsOptions });

    this.#io.on('connection', (socket) => {
      console.log('Socket connected: ', socket.id);

      const token = socket.handshake.auth?.token;
      if (!token) {
        console.log('Guest connection, no token');
        socket.userId = null;
        return;
      }

      const payload = verifyJWT(token);

      if (!payload) {
        console.log('Invalid token, disconnecting socket', socket.id);
        socket.disconnect();
        return;
      }

      socket.userId = payload.id;
      socket.role = payload.role;

      socket.join(socket.userId); // Add user to a personal room

      // Join admin room if role is ADMIN
      if (socket.role === 'admin') {
        socket.join('admins'); // This room can be used to send notifications for all admins.
        console.log(`Admin ${socket.userId} joined admins room`);
      }

      console.log(`User ${socket.userId} joined room`);

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // Get io instance
  static getIO() {
    if (!this.#io) throw new Error('Socket is not initialized');
    return this.#io;
  }

  // Return number of active users in system
  static getOnlineUserCount() {
    if (!this.#io) throw new Error('Socket is not initialized');

    const io = this.#io;
    const rooms = io.sockets.adapter.rooms;
    const sids = io.sockets.adapter.sids;

    const onlineUsers = new Set();

    for (const [roomName] of rooms) {
      if (sids.has(roomName)) continue; // Skip rooms that are socket IDs

      if (roomName === 'admins') continue; // We don't count admin because they are already in personal room like normal users

      onlineUsers.add(roomName);
    }

    return onlineUsers.size;
  }

  static emitToUser(userId, event, payload) {
    if (!this.#io) throw new Error('Socket is not initialized');

    this.getIO().to(userId).emit(event, payload);
  }

  static emitToAdmins(event, payload) {
    this.getIO().to('admins').emit(event, payload);
  }
}
