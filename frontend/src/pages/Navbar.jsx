import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Box,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    return (
        <AppBar position="static" sx={{ background: "#282c34" }}>
            <Toolbar>
                {/* Logo/Title */}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <Link
                        to="/home"
                        style={{
                            textDecoration: "none",
                            color: "white",
                            fontWeight: "bold",
                        }}
                    >
                        Apna Video Call
                    </Link>
                </Typography>

                {/* Navigation Buttons */}
                <Box sx={{ display: { xs: "none", md: "flex" } }}>
                    <Button
                        component={Link}
                        to="/home"
                        color="inherit"
                        startIcon={<HomeIcon />}
                    >
                        Home
                    </Button>
                    <Button
                        component={Link}
                        to="/history"
                        color="inherit"
                        startIcon={<RestoreIcon />}
                    >
                        History
                    </Button>
                    <Button
                        onClick={handleLogout}
                        color="inherit"
                        startIcon={<LogoutIcon />}
                    >
                        Logout
                    </Button>
                </Box>

                {/* Icons for Mobile (Optional but good) */}
                <Box sx={{ display: { xs: "flex", md: "none" } }}>
                    <IconButton component={Link} to="/home" color="inherit">
                        <HomeIcon />
                    </IconButton>
                    <IconButton component={Link} to="/history" color="inherit">
                        <RestoreIcon />
                    </IconButton>
                    <IconButton onClick={handleLogout} color="inherit">
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
