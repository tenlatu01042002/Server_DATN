const { Server } = require('socket.io');

let io;
const connectedUsers = {}; // Store connected users and their socket IDs

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      // Get `id_NguoiDung` from the client's handshake query
      const id_NguoiDung = socket.handshake.query.idNguoiDung;

      if (id_NguoiDung) {
        // Disconnect the previous connection if a user reconnects with the same ID
        if (connectedUsers[id_NguoiDung]) {
          const previousSocketId = connectedUsers[id_NguoiDung];
          console.log(`Disconnecting previous socket for user ${id_NguoiDung}: ${previousSocketId}`);
          io.sockets.sockets.get(previousSocketId)?.disconnect();
        }

        // Store the new connection
        connectedUsers[id_NguoiDung] = socket.id;
        socket.join(id_NguoiDung);
        console.log(`User with ID: ${id_NguoiDung} joined room ${id_NguoiDung}`);
      }

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the disconnected user's socket ID from the list
        for (const userId in connectedUsers) {
          if (connectedUsers[userId] === socket.id) {
            delete connectedUsers[userId];
            console.log(`Removed user ${userId} from connected users`);
            break;
          }
        }
      });

      // Custom events
      socket.on('custom-event', (data) => {
        console.log('Received custom-event with data:', data);
        io.to('admin-room').emit('new-notification', data);
      });

      socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log(`Socket ${socket.id} joined admin-room`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};