import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
// 1. UPDATED: Added Paper, Typography, and Box for the new lobby
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Paper,
    Typography,
    Box,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import styles from "../styles/videoComponent.module.css"; // Assuming this path is correct
import server from "../environment";

const server_url = server;

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const connectionsRef = useRef({});
    const videoMapRef = useRef({});
    const localVideoRef = useRef(null); // Ref for the local video element
    const previewRef = useRef(null);
    const chatScrollRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [videos, setVideos] = useState([]);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [showChat, setShowChat] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                let hasVideo = true;
                try {
                    await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (e) {
                    hasVideo = false;
                }
                setVideoAvailable(hasVideo);

                let hasAudio = true;
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (e) {
                    hasAudio = false;
                }
                setAudioAvailable(hasAudio);

                const hasDisplay =
                    navigator.mediaDevices &&
                    !!navigator.mediaDevices.getDisplayMedia;
                setScreenAvailable(hasDisplay);

                if (hasVideo || hasAudio) {
                    try {
                        const s = await navigator.mediaDevices.getUserMedia({
                            video: hasVideo,
                            audio: hasAudio,
                        });
                        window.localStream = s;
                        if (previewRef.current) {
                            previewRef.current.srcObject = s;
                        }
                        // We will set localVideoRef.current.srcObject in getMediaAndConnect
                    } catch (e) {
                        console.warn("Could not get user media initially:", e);
                        window.localStream = createBlackSilence();
                        if (previewRef.current)
                            previewRef.current.srcObject = window.localStream;
                    }
                } else {
                    window.localStream = createBlackSilence();
                    if (previewRef.current)
                        previewRef.current.srcObject = window.localStream;
                }
            } catch (err) {
                console.error("Permission check failed:", err);
            }
        })();
    }, []);

    const createBlackSilence = () => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            ctx.resume();
            const audioTrack = Object.assign(dst.stream.getAudioTracks()[0], {
                enabled: false,
            });

            const canvas = Object.assign(document.createElement("canvas"), {
                width: 640,
                height: 480,
            });
            canvas.getContext("2d").fillRect(0, 0, 640, 480);
            const stream = canvas.captureStream();
            const videoTrack = Object.assign(stream.getVideoTracks()[0], {
                enabled: false,
            });

            const ms = new MediaStream([videoTrack, audioTrack]);
            return ms;
        } catch (e) {
            console.warn("createBlackSilence failed:", e);
            return new MediaStream();
        }
    };

    const getMediaAndConnect = async () => {
        try {
            // 1. Determine if we *can* get video/audio, based on device availability.
            const hasVideoDevice =
                typeof videoAvailable === "boolean" ? videoAvailable : true;
            const hasAudioDevice =
                typeof audioAvailable === "boolean" ? audioAvailable : true;

            if (hasVideoDevice || hasAudioDevice) {
                try {
                    // 2. Request *all available* tracks, regardless of enabled state.
                    const s = await navigator.mediaDevices.getUserMedia({
                        video: hasVideoDevice,
                        audio: hasAudioDevice,
                    });

                    // 3. Immediately set the enabled state based on user's lobby choice.
                    s.getVideoTracks().forEach(
                        (t) => (t.enabled = videoEnabled)
                    );
                    s.getAudioTracks().forEach(
                        (t) => (t.enabled = audioEnabled)
                    );

                    window.localStream = s;
                    if (localVideoRef.current)
                        localVideoRef.current.srcObject = s;
                } catch (e) {
                    console.warn("getUserMedia failed at connect:", e);
                    window.localStream = createBlackSilence();
                    // Ensure black stream also respects enabled state
                    window.localStream
                        .getVideoTracks()
                        .forEach((t) => (t.enabled = videoEnabled));
                    window.localStream
                        .getAudioTracks()
                        .forEach((t) => (t.enabled = audioEnabled));

                    if (localVideoRef.current)
                        localVideoRef.current.srcObject = window.localStream;
                }
            } else {
                // No devices at all
                window.localStream = createBlackSilence();
                if (localVideoRef.current)
                    localVideoRef.current.srcObject = window.localStream;
            }
        } catch (e) {
            console.warn("getMediaAndConnect error:", e);
        }

        connectToSocketServer();
    };

    const connectToSocketServer = () => {
        if (socketRef.current) return;
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit("join-call", window.location.href);
        });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
            // =================================================================
            // FIX: Only add message to state if it's from another user
            // The sender's message is already added locally in sendMessage
            // =================================================================
            if (socketIdSender !== socketIdRef.current) {
                setMessages((prev) => [
                    ...prev,
                    { sender, data, socketIdSender, time: Date.now() },
                ]);
                setNewMessages((n) => n + 1);
            }
        });

        socketRef.current.on("mute-status", (socketId, isMuted) => {
            console.log("peer mute status", socketId, isMuted);
        });

        socketRef.current.on("user-left", (id) => {
            setVideos((prev) => prev.filter((v) => v.socketId !== id));
            if (connectionsRef.current[id]) {
                try {
                    connectionsRef.current[id].close();
                } catch (e) {}
                delete connectionsRef.current[id];
            }
            delete videoMapRef.current[id];
        });

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach((clientId) => {
                if (clientId === socketIdRef.current) return;
                if (!connectionsRef.current[clientId]) {
                    const pc = new RTCPeerConnection(peerConfigConnections);

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit(
                                "signal",
                                clientId,
                                JSON.stringify({ ice: event.candidate })
                            );
                        }
                    };

                    pc.ontrack = (ev) => {
                        const stream =
                            ev.streams && ev.streams[0] ? ev.streams[0] : null;
                        if (!stream) return;
                        videoMapRef.current[clientId] = stream;

                        setVideos((prev) => {
                            const found = prev.find(
                                (p) => p.socketId === clientId
                            );
                            if (found) {
                                return prev.map((v) =>
                                    v.socketId === clientId
                                        ? { ...v, stream }
                                        : v
                                );
                            } else {
                                const ordered = clients
                                    .filter((c) => c !== socketIdRef.current)
                                    .map((c) => ({
                                        socketId: c,
                                        stream: videoMapRef.current[c] || null,
                                    }));
                                return ordered;
                            }
                        });
                    };

                    const localStream =
                        window.localStream || createBlackSilence();
                    try {
                        localStream
                            .getTracks()
                            .forEach((t) => pc.addTrack(t, localStream));
                    } catch (e) {}

                    connectionsRef.current[clientId] = pc;
                }
            });

            const ordered = clients
                .filter((c) => c !== socketIdRef.current)
                .map((c) => ({
                    socketId: c,
                    stream: videoMapRef.current[c] || null,
                }));
            setVideos(ordered);

            if (id === socketIdRef.current) {
                for (let otherId in connectionsRef.current) {
                    if (otherId === socketIdRef.current) continue;
                    const pc = connectionsRef.current[otherId];
                    try {
                        pc.createOffer()
                            .then((desc) => pc.setLocalDescription(desc))
                            .then(() => {
                                socketRef.current.emit(
                                    "signal",
                                    otherId,
                                    JSON.stringify({ sdp: pc.localDescription })
                                );
                            })
                            .catch((e) => console.warn("offer error:", e));
                    } catch (e) {}
                }
            }
        });
    };

    const gotMessageFromServer = (fromId, message) => {
        let signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;

        if (!connectionsRef.current[fromId]) {
            const pc = new RTCPeerConnection(peerConfigConnections);
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ ice: event.candidate })
                    );
                }
            };
            pc.ontrack = (ev) => {
                const stream =
                    ev.streams && ev.streams[0] ? ev.streams[0] : null;
                if (!stream) return;
                videoMapRef.current[fromId] = stream;
                setVideos((prev) =>
                    prev.map((v) =>
                        v.socketId === fromId ? { ...v, stream } : v
                    )
                );
            };
            try {
                const localStream = window.localStream || createBlackSilence();
                localStream
                    .getTracks()
                    .forEach((t) => pc.addTrack(t, localStream));
            } catch (e) {}
            connectionsRef.current[fromId] = pc;
        }

        const pc = connectionsRef.current[fromId];

        if (signal.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === "offer") {
                        return pc
                            .createAnswer()
                            .then((description) =>
                                pc.setLocalDescription(description)
                            )
                            .then(() => {
                                socketRef.current.emit(
                                    "signal",
                                    fromId,
                                    JSON.stringify({ sdp: pc.localDescription })
                                );
                            });
                    }
                })
                .catch((e) => console.warn("sdp error:", e));
        }

        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) =>
                console.warn("ice error:", e)
            );
        }
    };

    useEffect(() => {
        return () => {
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach((t) => t.stop());
                }
            } catch (e) {}
            Object.values(connectionsRef.current).forEach((pc) => {
                try {
                    pc.close();
                } catch (e) {}
            });
            connectionsRef.current = {};

            if (socketRef.current) {
                try {
                    socketRef.current.off();
                    socketRef.current.disconnect();
                } catch (e) {}
                socketRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop =
                chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = useCallback(() => {
        if (!message.trim() || !socketRef.current) return;
        const msg = message.trim();
        socketRef.current.emit("chat-message", msg, username);
        setMessages((prev) => [
            ...prev,
            {
                sender: username || "You",
                data: msg,
                socketIdSender: socketIdRef.current,
                time: Date.now(),
            },
        ]);
        setMessage("");
    }, [message, username]);

    // Added handlers for chat input
    const handleChatInput = (e) => {
        setMessage(e.target.value);
    };

    const handleChatKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleToggleVideo = async () => {
        setVideoEnabled((v) => {
            const next = !v;
            try {
                if (window.localStream) {
                    window.localStream
                        .getVideoTracks()
                        .forEach((t) => (t.enabled = next));
                }
            } catch (e) {}
            return next;
        });
    };

    const handleToggleAudio = () => {
        setAudioEnabled((prev) => {
            const next = !prev;
            try {
                if (window.localStream) {
                    window.localStream
                        .getAudioTracks()
                        .forEach((t) => (t.enabled = next));
                }
            } catch (e) {
                console.warn("Toggle audio failed:", e);
            }

            if (socketRef.current) {
                try {
                    socketRef.current.emit(
                        "mute-status",
                        socketIdRef.current,
                        !next
                    );
                } catch (e) {}
            }

            return next;
        });
    };

    const handleScreenShare = async () => {
        if (!screenAvailable) return;
        if (!screenSharing) {
            try {
                const screenStream =
                    await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: true,
                    });

                Object.values(connectionsRef.current).forEach((pc) => {
                    try {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(
                            (s) => s.track && s.track.kind === "video"
                        );
                        if (videoSender) {
                            videoSender.replaceTrack(
                                screenStream.getVideoTracks()[0]
                            );
                        }
                    } catch (e) {}
                });

                // Update local stream and video element
                window.localStream = screenStream;
                if (localVideoRef.current)
                    localVideoRef.current.srcObject = screenStream;

                screenStream.getTracks().forEach((t) => {
                    t.onended = async () => {
                        try {
                            const camStream =
                                await navigator.mediaDevices.getUserMedia({
                                    video: videoEnabled && videoAvailable,
                                    audio: audioEnabled && audioAvailable,
                                });
                            window.localStream = camStream;
                            if (localVideoRef.current)
                                localVideoRef.current.srcObject = camStream;

                            Object.values(connectionsRef.current).forEach(
                                (pc) => {
                                    try {
                                        const senders = pc.getSenders();
                                        const videoSender = senders.find(
                                            (s) =>
                                                s.track &&
                                                s.track.kind === "video"
                                        );
                                        if (
                                            videoSender &&
                                            camStream.getVideoTracks()[0]
                                        ) {
                                            videoSender.replaceTrack(
                                                camStream.getVideoTracks()[0]
                                            );
                                        }
                                    } catch (e) {}
                                }
                            );
                        } catch (e) {
                            console.warn(
                                "Couldn't get camera after screen share end:",
                                e
                            );
                        }
                        setScreenSharing(false);
                    };
                });
                setScreenSharing(true);
            } catch (e) {
                console.warn("Screen share failed:", e);
            }
        } else {
            // Stop screen sharing (user clicked stop button)
            // This logic is mostly handled by the 'onended' event,
            // but we can force it if needed.
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach((t) => t.stop());
                }
                // The 'onended' listener should then fire and restore the camera.
            } catch (e) {
                console.warn("Error stopping screen share:", e);
            }
            setScreenSharing(false);
        }
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach((t) => t.stop());
            }
        } catch (e) {}
        Object.values(connectionsRef.current).forEach((pc) => {
            try {
                pc.close();
            } catch (e) {}
        });
        if (socketRef.current) {
            try {
                socketRef.current.disconnect();
            } catch (e) {}
        }
        window.location.href = "/"; // Or any other lobby/home page
    };

    const connect = () => {
        if (!username.trim()) {
            alert("Please enter your name.");
            return;
        }
        setAskForUsername(false);
        getMediaAndConnect();
    };

    // 2. UPDATED: This entire `return` block is replaced.
    return (
        <div>
            {askForUsername ? (
                // --- THIS IS THE NEW ADVANCED LOBBY UI ---
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        bgcolor: "#282c34", // Dark background
                        p: 2,
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: { xs: 2, sm: 4 }, // Responsive padding
                            borderRadius: "16px",
                            maxWidth: "500px",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2, // Spacing between elements
                        }}
                    >
                        <Typography
                            variant="h4"
                            component="h2"
                            align="center"
                            gutterBottom
                            fontWeight="bold"
                        >
                            Join Lobby
                        </Typography>

                        {/* Video Preview */}
                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16/9",
                                bgcolor: "#000",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "1px solid #ddd",
                            }}
                        >
                            <video
                                ref={previewRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: videoEnabled ? "block" : "none", // Hide video if disabled
                                }}
                            />
                            {/* Show placeholder if video is off */}
                            {!videoEnabled && (
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: "#202020",
                                        color: "#888",
                                    }}
                                >
                                    <VideocamOffIcon sx={{ fontSize: 60 }} />
                                </Box>
                            )}
                            {/* Controls */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 10,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    display: "flex",
                                    gap: 1.5,
                                    bgcolor: "rgba(0, 0, 0, 0.5)",
                                    p: 1,
                                    borderRadius: "50px",
                                }}
                            >
                                <IconButton
                                    onClick={handleToggleAudio}
                                    size="small"
                                    sx={{
                                        color: "white",
                                        bgcolor: audioEnabled
                                            ? "rgba(255, 255, 255, 0.2)"
                                            : "#f44336",
                                        "&:hover": {
                                            bgcolor: audioEnabled
                                                ? "rgba(255, 255, 255, 0.3)"
                                                : "#d32f2f",
                                        },
                                    }}
                                >
                                    {audioEnabled ? (
                                        <MicIcon />
                                    ) : (
                                        <MicOffIcon />
                                    )}
                                </IconButton>
                                <IconButton
                                    onClick={handleToggleVideo}
                                    size="small"
                                    sx={{
                                        color: "white",
                                        bgcolor: videoEnabled
                                            ? "rgba(255, 255, 255, 0.2)"
                                            : "#f44336",
                                        "&:hover": {
                                            bgcolor: videoEnabled
                                                ? "rgba(255, 255, 255, 0.3)"
                                                : "#d32f2f",
                                        },
                                    }}
                                >
                                    {videoEnabled ? (
                                        <VideocamIcon />
                                    ) : (
                                        <VideocamOffIcon />
                                    )}
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Username Input */}
                        <TextField
                            id="outlined-basic"
                            label="Enter Your Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            variant="outlined"
                            onKeyDown={(e) => e.key === "Enter" && connect()}
                            fullWidth
                            required
                        />

                        {/* Connect Button */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={connect}
                            fullWidth
                            size="large"
                            sx={{
                                py: 1.5,
                                fontSize: "1rem",
                                fontWeight: "bold",
                            }}
                        >
                            Connect
                        </Button>
                    </Paper>
                </Box>
            ) : (
                // --- YOUR ORIGINAL CALL UI (UNCHANGED) ---
                <div className={styles.meetVideoContainer}>
                    {/* Main content area */}
                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            flex: 1, // <-- This is the fix
                            overflow: "hidden", // Prevents this container from scrolling
                        }}
                    >
                        {/* Chat Panel */}
                        {showChat && (
                            <div className={styles.chatRoom}>
                                <div className={styles.chatHeader}>
                                    <h2>Chat</h2>
                                </div>
                                <div
                                    ref={chatScrollRef}
                                    id="chatDisplay"
                                    className={styles.chattingArea}
                                >
                                    {messages.length > 0 ? (
                                        messages.map((item, index) => {
                                            const mine =
                                                item.socketIdSender ===
                                                socketIdRef.current;

                                            const timeStr = item.time
                                                ? new Date(
                                                      item.time
                                                  ).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "";

                                            return (
                                                <div
                                                    key={index}
                                                    className={
                                                        mine
                                                            ? styles.myMessage
                                                            : styles.otherMessage
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.sender
                                                        }
                                                    >
                                                        {!mine
                                                            ? item.sender
                                                            : "You"}
                                                    </div>
                                                    <div>{item.data}</div>
                                                    <span
                                                        className={
                                                            styles.timestamp
                                                        }
                                                    >
                                                        {timeStr}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div
                                            style={{
                                                textAlign: "center",
                                                color: "#888",
                                                marginTop: 20,
                                                fontStyle: "italic",
                                            }}
                                        >
                                            No messages yet.
                                        </div>
                                    )}
                                </div>

                                <div className={styles.chatInputArea}>
                                    <TextField
                                        label="Type a message..."
                                        variant="outlined"
                                        value={message}
                                        onChange={handleChatInput}
                                        onKeyDown={handleChatKeyDown}
                                        size="small"
                                        style={{ flex: 1 }}
                                        multiline
                                        maxRows={3}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={sendMessage}
                                        style={{ marginLeft: "8px" }}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Video Grid */}
                        <div
                            className={styles.conferenceView}
                            style={{
                                flex: 1, // Take remaining space
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                padding: 8,
                                overflowY: "auto",
                                alignContent: "flex-start",
                            }}
                        >
                            {/* Local video feed */}
                            <div
                                style={{
                                    width: 240,
                                    height: 180,
                                    background: "#000",
                                    position: "relative",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                }}
                            >
                                <video
                                    ref={localVideoRef} // Attached ref
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "5px",
                                        left: "5px",
                                        background: "rgba(0,0,0,0.5)",
                                        padding: "2px 5px",
                                        borderRadius: "3px",
                                        fontSize: "12px",
                                        color: "white",
                                    }}
                                >
                                    {username} (You)
                                </div>
                            </div>

                            {/* Remote video feeds */}
                            {videos.map((v) => (
                                <div
                                    key={v.socketId}
                                    style={{
                                        width: 240,
                                        height: 180,
                                        background: "#000",
                                        position: "relative",
                                        borderRadius: 8,
                                        overflow: "hidden",
                                    }}
                                >
                                    <video
                                        ref={(ref) => {
                                            if (ref) {
                                                if (v.stream) {
                                                    if (
                                                        ref.srcObject !==
                                                        v.stream
                                                    )
                                                        ref.srcObject =
                                                            v.stream;
                                                } else {
                                                    if (ref.srcObject)
                                                        ref.srcObject = null;
                                                }
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                    {/* You would need to emit/sync usernames to display them here */}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleToggleVideo}
                            style={{ color: videoEnabled ? "white" : "red" }}
                        >
                            {videoEnabled ? (
                                <VideocamIcon />
                            ) : (
                                <VideocamOffIcon />
                            )}
                        </IconButton>

                        <IconButton
                            onClick={handleToggleAudio}
                            style={{ color: audioEnabled ? "white" : "red" }}
                        >
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton
                                onClick={handleScreenShare}
                                style={{
                                    color: screenSharing ? "#1976d2" : "white",
                                }}
                            >
                                {screenSharing ? (
                                    <StopScreenShareIcon />
                                ) : (
                                    <ScreenShareIcon />
                                )}
                            </IconButton>
                        )}

                        <IconButton onClick={handleEndCall}>
                            <CallEndIcon style={{ color: "#ff4747" }} />
                        </IconButton>

                        <IconButton
                            onClick={() => {
                                setShowChat((prev) => !prev);
                                if (!showChat) setNewMessages(0);
                            }}
                            style={{ color: "white" }}
                        >
                            <Badge badgeContent={newMessages} color="primary">
                                <ChatIcon />
                            </Badge>
                        </IconButton>
                    </div>
                </div>
            )}
        </div>
    );
}
