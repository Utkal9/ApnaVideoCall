import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Video,
    LogIn,
    Users,
    Plus,
    LogOut,
    History as HistoryIcon, // Renamed to avoid conflict
} from "lucide-react";
import { checkAuth } from "../auth.js";
import { AuthContext } from "../contexts/AuthContext";

export default function LandingPage() {
    const navigate = useNavigate();
    const { addToUserHistory } = useContext(AuthContext);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [roomId, setRoomId] = useState("");

    useEffect(() => {
        setIsAuthenticated(checkAuth());
    }, []);

    // --- LOGGED-IN USER ACTIONS ---
    const createAndJoinRoom = async () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        try {
            // This is an authenticated action
            await addToUserHistory(newRoomId);
            navigate(`/${newRoomId}`);
        } catch (err) {
            console.error("Failed to add to history:", err);
            // Don't navigate if history failed, as user might be logged out
        }
    };

    const joinRoom = async () => {
        if (roomId.trim()) {
            const trimmedRoomId = roomId.trim();
            try {
                // This is an authenticated action
                await addToUserHistory(trimmedRoomId);
                navigate(`/${trimmedRoomId}`);
            } catch (err) {
                console.error("Failed to add to history:", err);
            }
        } else {
            console.warn("Room ID cannot be empty");
        }
    };

    // --- GUEST USER ACTIONS ---
    const createAndJoinGuest = () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        // No history, just navigate
        navigate(`/${newRoomId}`);
    };

    const joinGuest = () => {
        if (roomId.trim()) {
            // No history, just navigate
            navigate(`/${roomId.trim()}`);
        } else {
            console.warn("Room ID cannot be empty");
        }
    };

    // --- SHARED ACTIONS ---
    const handleJoinKeyPress = (e) => {
        if (e.key === "Enter") {
            // The "Enter" key will trigger the correct
            // join function based on auth state
            if (isAuthenticated) {
                joinRoom();
            } else {
                joinGuest();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/auth");
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white font-inter">
            {/* --- Navigation Bar --- */}
            <nav className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Video className="h-8 w-8 text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">
                                Apna Video Call
                            </h2>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            {isAuthenticated ? (
                                // --- LOGGED-IN NAV ---
                                <>
                                    <Link
                                        to="/history"
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <HistoryIcon className="h-5 w-5" />
                                        History
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-200 ease-in-out hover:scale-105 flex items-center gap-2"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                // --- GUEST NAV ---
                                <>
                                    <Link
                                        to="/auth"
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <Users className="h-5 w-5 inline-block mr-1" />
                                        Register
                                    </Link>
                                    <Link
                                        to="/auth"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-200 ease-in-out hover:scale-105 flex items-center gap-2"
                                    >
                                        <LogIn className="h-5 w-5" />
                                        Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <main className="flex-1 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16 md:py-24">
                        {/* Left Side: Text Content & CTAs */}
                        <div className="flex-1 max-w-2xl text-center lg:text-left">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                <span className="text-blue-400">Connect</span>{" "}
                                with your loved ones, instantly.
                            </h1>
                            <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-lg mx-auto lg:mx-0">
                                {isAuthenticated
                                    ? "Create a new room or join one. Your meetings will be saved to your history."
                                    : "Join as a guest or log in for the full experience."}
                            </p>

                            {/* --- Call to Action Buttons --- */}
                            {/* --- THIS IS THE NEW CONDITIONAL LOGIC --- */}
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {isAuthenticated ? (
                                    // --- LOGGED-IN BUTTONS ---
                                    <>
                                        <button
                                            onClick={createAndJoinRoom}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-transform duration-200 ease-in-out hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                                        >
                                            <Plus className="h-6 w-6" />
                                            New Meeting
                                        </button>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={roomId}
                                                onChange={(e) =>
                                                    setRoomId(e.target.value)
                                                }
                                                onKeyPress={handleJoinKeyPress}
                                                placeholder="Enter Room ID"
                                                className="flex-1 sm:flex-auto bg-gray-800 border border-gray-700 text-white px-5 py-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                aria-label="Enter Room ID"
                                            />
                                            <button
                                                onClick={joinRoom}
                                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex-shrink-0"
                                                aria-label="Join Room"
                                            >
                                                <LogIn className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // --- GUEST BUTTONS ---
                                    <>
                                        <button
                                            onClick={createAndJoinGuest}
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-transform duration-200 ease-in-out hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                                        >
                                            <Plus className="h-6 w-6" />
                                            Create Guest Room
                                        </button>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={roomId}
                                                onChange={(e) =>
                                                    setRoomId(e.target.value)
                                                }
                                                onKeyPress={handleJoinKeyPress}
                                                placeholder="Enter Room ID"
                                                className="flex-1 sm:flex-auto bg-gray-800 border border-gray-700 text-white px-5 py-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                aria-label="Enter Room ID"
                                            />
                                            <button
                                                onClick={joinGuest}
                                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex-shrink-0"
                                                aria-label="Join as Guest"
                                            >
                                                <LogIn className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Image (Unchanged) */}
                        <div className="flex-1 flex justify-center lg:justify-end mt-10 lg:mt-0">
                            <img
                                src="https://placehold.co/450x550/111827/38BDF8?text=ApnaVideoCall&font=inter"
                                alt="Video call demonstration"
                                className="rounded-2xl shadow-2xl shadow-blue-900/20 max-w-sm w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
