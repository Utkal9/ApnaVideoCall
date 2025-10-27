import { Server } from "socket.io";

// --- CHANGED ---
// We no longer need 'connections'. Socket.IO will manage this.
// We still need 'messages' for chat history.
let messages = {};
// 'timeOnline' is not used, so it's removed.

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // --- CHANGED ---
        // More descriptive log
        console.log(`User ${socket.id} connected.`);

        socket.on("join-call", (path) => {
            // --- CHANGED ---
            // Use Socket.IO's room feature. This is much faster.
            socket.join(path);
            // Store the room path on the socket object for easy access later.
            socket.room = path;

            // Get a list of all clients in the room.
            // This is a Set, so we convert it to an array.
            const clients = io.sockets.adapter.rooms.get(path);
            const clientsArr = clients ? Array.from(clients) : [];

            // Emit 'user-joined' to EVERYONE in the room (including the new user).
            io.to(path).emit("user-joined", socket.id, clientsArr);

            // Send existing chat history ONLY to the new user.
            if (messages[path] !== undefined) {
                messages[path].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.data,
                        msg.sender,
                        msg.socketIdSender
                    );
                });
            }
        });

        socket.on("signal", (toId, message) => {
            // This logic is perfect, no change needed.
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // --- CHANGED ---
            // This is now O(1) (instant) instead of iterating all rooms.
            const room = socket.room;

            if (room) {
                if (messages[room] === undefined) {
                    messages[room] = [];
                }
                messages[room].push({
                    sender: sender,
                    data: data,
                    // Switched to camelCase for convention
                    socketIdSender: socket.id,
                });
                console.log("message", room, ":", sender, data);

                // Broadcast the message to EVERYONE in the room.
                io.to(room).emit("chat-message", data, sender, socket.id);
            }
        });

        socket.on("disconnect", () => {
            // --- CHANGED ---
            // Removed unused 'diffTime' calculation.

            // This is now O(1) (instant) instead of the complex loop.
            const room = socket.room;

            if (room) {
                // Tell everyone else in the room that this user left.
                io.to(room).emit("user-left", socket.id);

                // Socket.IO handles 'socket.leave(room)' automatically on disconnect.

                // --- FIX: MEMORY LEAK ---
                // Check if the room is now empty.
                const clients = io.sockets.adapter.rooms.get(room);
                if (!clients || clients.size === 0) {
                    // If the room is empty, delete its chat history
                    if (messages[room] !== undefined) {
                        delete messages[room];
                        console.log(`Cleaned up empty room: ${room}`);
                    }
                }
            }
        });
    });

    return io;
};
