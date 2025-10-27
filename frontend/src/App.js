import "./App.css";
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
import { checkAuth } from "./auth";

// This component prevents logged-in users from seeing the /auth page
const PublicRoute = () => {
    const isAuthenticated = checkAuth();
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

                        <Route element={<PublicRoute />}>
                            <Route path="/auth" element={<Authentication />} />
                        </Route>

                        {/* --- NEW: 'url' IS NOW A PUBLIC ROUTE --- */}
                        {/* Guests and Logged-in users can access this. */}
                        {/* The component itself will handle auth. */}
                        <Route path="/:url" element={<VideoMeetComponent />} />

                        {/* --- PROTECTED ROUTES --- */}
                        {/* Only logged-in users can see these. */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/history" element={<History />} />
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;
