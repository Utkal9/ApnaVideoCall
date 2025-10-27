import "./App.css";
// 1. Import Navigate and Outlet
import {
    Route,
    BrowserRouter as Router,
    Routes,
    Navigate,
    Outlet,
} from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./pages/VideoMeet";
import History from "./pages/history";
import ProtectedRoute from "./pages/ProtectedRoute";
import { checkAuth } from "./auth"; // 2. Import checkAuth

// 3. --- CREATE A PUBLIC ROUTE COMPONENT ---
// This prevents logged-in users from seeing the /auth page
const PublicRoute = () => {
    const isAuthenticated = checkAuth();
    // If logged in, redirect to home. Otherwise, show the auth page.
    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
    return (
        <div className="App">
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* --- PUBLIC ROUTES --- */}
                        <Route path="/" element={<LandingPage />} />

                        {/* 4. Wrap /auth in the new PublicRoute */}
                        <Route element={<PublicRoute />}>
                            <Route path="/auth" element={<Authentication />} />
                        </Route>

                        {/* --- PROTECTED ROUTES --- */}
                        {/* Your existing ProtectedRoute wrapper is perfect */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/history" element={<History />} />
                            <Route
                                path="/:url"
                                element={<VideoMeetComponent />}
                            />
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;
