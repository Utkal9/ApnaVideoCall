import { Server } from "socket.io";
import { URL } from "url"; // Import the URL module to parse the path

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
        console.log(`User ${socket.id} connected, attempting to join...`);

        socket.on("join-call", (path) => {
            // --- NEW SECURITY CHECK ---
            // The frontend sends the full window.location.href, so we parse it
            let roomId;
            try {
                // Parse the full URL, e.g., http://localhost:3001/room-id
                const url = new URL(path);
                roomId = url.pathname.replace("/", ""); // Get just the 'room-id' part
            } catch (e) {
                console.warn("Invalid room path received:", path);
                // Fallback for any other path format
                roomId = path.split("/").pop() || path;
            }

            // Check if this is a 1-on-1 call (24char-ID + '-' + 24char-ID = 49 chars)
            const isPrivateCall = roomId.length === 49 && roomId.includes("-");

            if (isPrivateCall) {
                console.log(
                    `[Security] Room ${roomId} is a private 1-on-1 call.`
                );
                // It's a private call, check the room occupancy *before* joining
                const clients = io.sockets.adapter.rooms.get(path);
                const numClients = clients ? clients.size : 0;
                console.log(
                    `[Security] Room ${roomId} currently has ${numClients} user(s).`
                );

                if (numClients >= 2) {
                    // This room is full. Disconnect this new user.
                    console.log(
                        `[Security] Denied connection for ${socket.id}: Room ${roomId} is full.`
                    );
                    // We must emit this *before* disconnecting
                    io.to(socket.id).emit("room-full");
                    socket.disconnect(true);
                    return; // Stop processing the join-call event
                }
            } else {
                console.log(`[Security] Room ${roomId} is a public call.`);
            }
            // --- END SECURITY CHECK ---

            // --- CHANGED ---
            // Use Socket.IO's room feature. This is much faster.
            socket.join(path);
            // Store the room path on the socket object for easy access later.
            socket.room = path;
            socket.roomID = roomId; // Store the clean room ID

            // Get a list of all clients in the room.
            // This is a Set, so we convert it to an array.
            const clients = io.sockets.adapter.rooms.get(path);
            const clientsArr = clients ? Array.from(clients) : [];

            console.log(
                `User ${socket.id} successfully joined room: ${roomId}`
            );

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
            const roomId = socket.roomID; // Use the clean ID for logging

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
                console.log("message", roomId, ":", sender, data);

                // Broadcast the message to EVERYONE in the room.
                io.to(room).emit("chat-message", data, sender, socket.id);
            }
        });

        socket.on("disconnect", () => {
            // --- CHANGED ---
            // Removed unused 'diffTime' calculation.

            // This is now O(1) (instant) instead of the complex loop.
            const room = socket.room;
            const roomId = socket.roomID;

            if (room) {
                // Tell everyone else in the room that this user left.
                io.to(room).emit("user-left", socket.id);
                console.log(`User ${socket.id} left room: ${roomId}`);

                // Socket.IO handles 'socket.leave(room)' automatically on disconnect.

                // --- FIX: MEMORY LEAK ---
                // Check if the room is now empty.
                // We do this check slightly after, to allow socket.io to update
                setTimeout(() => {
                    const clients = io.sockets.adapter.rooms.get(room);
                    if (!clients || clients.size === 0) {
                        // If the room is empty, delete its chat history
                        if (messages[room] !== undefined) {
                            delete messages[room];
                            console.log(`Cleaned up empty room: ${roomId}`);
                        }
                    }
                }, 1000); // 1-second delay
            } else {
                console.log(`User ${socket.id} disconnected (no room).`);
            }
        });
    });

    return io;
};
