import React, { useContext } from "react"; // 1. Import useContext
import { Navigate, Outlet } from "react-router-dom";
import { checkAuth } from "../auth"; // 2. We still use this
import { AuthContext } from "../contexts/AuthContext"; // 3. Import AuthContext
import { CircularProgress, Box } from "@mui/material"; // 4. For a loading spinner

export default function ProtectedRoute() {
    // 5. Get the loading state from the context
    const { loading } = useContext(AuthContext);
    const isAuthenticated = checkAuth(); // Checks if token *exists*

    // 6. --- SHOW LOADING SPINNER ---
    // If the context is still validating the token, show a spinner
    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    bgcolor: "#111827", // Matches your dark theme
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // 7. --- POST-LOADING CHECK ---
    // After loading, if the token *still* doesn't exist (or was removed by the interceptor),
    // redirect to /auth. We pass the 'from' location.
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // 8. If loading is done AND token exists, show the page
    return <Outlet />;
}
