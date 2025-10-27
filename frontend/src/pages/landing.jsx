import React, { useState, useEffect, useContext } from "react"; // 1. Added useContext
import { Link, useNavigate } from "react-router-dom"; // 2. Re-added useNavigate
import {
    Video,
    LogIn,
    Users,
    Plus,
    LogOut,
    History, // 3. Added History icon
} from "lucide-react";
import { checkAuth } from "../auth.js";
import { AuthContext } from "../contexts/AuthContext"; // 4. Import AuthContext

export default function LandingPage() {
    const navigate = useNavigate();
    const { addToUserHistory } = useContext(AuthContext); // 5. Get history function
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [roomId, setRoomId] = useState("");

    useEffect(() => {
        setIsAuthenticated(checkAuth());
    }, []);

    /**
     * Generates a random string for a new room ID and navigates to it.
     */
    const createAndJoinRoom = async () => {
        // 6. Make function async
        const newRoomId = Math.random().toString(36).substring(2, 9);

        // 7. Add to history if logged in
        if (isAuthenticated && addToUserHistory) {
            try {
                await addToUserHistory(newRoomId);
            } catch (err) {
                console.error("Failed to add to history:", err);
            }
        }
        navigate(`/${newRoomId}`); // Use navigate for cleaner routing
    };

    /**
     * Navigates to the room ID entered in the input field.
     */
    const joinRoom = async () => {
        // 8. Make function async
        if (roomId.trim()) {
            const trimmedRoomId = roomId.trim();

            // 9. Add to history if logged in
            if (isAuthenticated && addToUserHistory) {
                try {
                    await addToUserHistory(trimmedRoomId);
                } catch (err) {
                    console.error("Failed to add to history:", err);
                }
            }
            navigate(`/${trimmedRoomId}`); // Use navigate
        } else {
            console.warn("Room ID cannot be empty");
        }
    };

    /**
     * Handles key press on the input field to join on "Enter".
     */
    const handleJoinKeyPress = (e) => {
        if (e.key === "Enter") {
            joinRoom();
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
                        {/* Logo / Title */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Video className="h-8 w-8 text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">
                                Apna Video Call
                            </h2>
                        </div>

                        {/* --- CONDITIONAL NAVIGATION LINKS --- */}
                        <div className="hidden md:flex items-center space-x-6">
                            {isAuthenticated ? (
                                // --- Show this if LOGGED IN ---
                                <>
                                    {/* 10. Added History Link */}
                                    <Link
                                        to="/history"
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <History className="h-5 w-5" />
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
                                // --- Show this if LOGGED OUT ---
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

            {/* --- Hero Section (Unchanged) --- */}
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
                                Cover the distance with Apna Video Call.
                                High-quality, secure video meetings for
                                everyone.
                            </p>

                            {/* Call to Action Buttons */}
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {/* Create New Meeting */}
                                <button
                                    onClick={createAndJoinRoom}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-transform duration-200 ease-in-out hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                                >
                                    <Plus className="h-6 w-6" />
                                    New Meeting
                                </button>

                                {/* Join Existing Meeting */}
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
