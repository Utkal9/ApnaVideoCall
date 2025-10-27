import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles"; // Import styled
import { AuthContext } from "../contexts/AuthContext";
import {
    Snackbar,
    Alert,
    CircularProgress,
    ToggleButton, // Import ToggleButton
    ToggleButtonGroup, // Import ToggleButtonGroup
} from "@mui/material";
import { useLocation } from "react-router-dom";

// A simple Copyright component for the bottom
function Copyright(props) {
    return (
        <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            {...props}
        >
            {"Copyright © "}
            <Link color="inherit" href="/">
                Apna Video Call
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

// 1. Create a "2025" dark theme
const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#38bdf8", // A blue accent, similar to your landing page
        },
        background: {
            default: "#111827", // Matches bg-gray-900
            paper: "rgba(17, 24, 39, 0.8)", // Dark, semi-transparent
        },
    },
    typography: {
        fontFamily: "Inter, sans-serif", // Match your landing page font
    },
});

// 2. Create a styled "Glass" Paper component
const GlassPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)", // For Safari
    background: "rgba(17, 24, 39, 0.75)", // Semi-transparent dark
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.125)",
}));

// 3. Create a styled ToggleButtonGroup
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    width: "100%",
    marginBottom: theme.spacing(2),
    "& .MuiToggleButtonGroup-grouped": {
        flex: 1,
        border: 0,
        "&.Mui-disabled": {
            border: 0,
        },
        "&:not(:first-of-type)": {
            borderRadius: theme.shape.borderRadius,
        },
        "&:first-of-type": {
            borderRadius: theme.shape.borderRadius,
        },
    },
}));

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [view, setView] = React.useState("login"); // Use 'login' or 'register'
    const [openSnackbar, setOpenSnackbar] = React.useState(false);

    const { state } = useLocation();
    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const redirectPath = state?.from?.pathname;
            if (view === "login") {
                await handleLogin(username, password, redirectPath);
            } else {
                let result = await handleRegister(name, username, password);
                setMessage(result);
                setOpenSnackbar(true);
                setUsername("");
                setPassword("");
                setName("");
                setView("login"); // Switch to login view
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "An unknown error occurred. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
            setError("");
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSnackbar(false);
    };

    // 4. Use the new darkTheme
    return (
        <ThemeProvider theme={darkTheme}>
            {/* 5. Main Grid is now the full-screen background container */}
            <Grid
                container
                component="main"
                sx={{
                    height: "100vh",
                    backgroundImage:
                        "url(https://source.unsplash.com/random?wallpapers)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CssBaseline />
                {/* 6. A centered Grid item holds the Glass form */}
                <Grid item xs={11} sm={8} md={5} lg={4} xl={3}>
                    {/* 7. Use the styled GlassPaper component */}
                    <GlassPaper elevation={12}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
                                <LockOutlinedIcon />
                            </Avatar>
                            <Typography
                                component="h1"
                                variant="h5"
                                sx={{ mb: 2 }}
                            >
                                {view === "login"
                                    ? "Welcome Back"
                                    : "Create Account"}
                            </Typography>

                            {/* 8. Use the styled ToggleButtonGroup */}
                            <StyledToggleButtonGroup
                                value={view}
                                exclusive
                                onChange={handleViewChange}
                                aria-label="Login or Register"
                            >
                                <ToggleButton value="login" aria-label="login">
                                    Sign In
                                </ToggleButton>
                                <ToggleButton
                                    value="register"
                                    aria-label="register"
                                >
                                    Sign Up
                                </ToggleButton>
                            </StyledToggleButtonGroup>

                            <Box
                                component="form"
                                noValidate
                                onSubmit={handleAuth}
                                sx={{ mt: 1, width: "100%" }}
                            >
                                {view === "register" && (
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="name"
                                        label="Full Name"
                                        name="name"
                                        autoComplete="name"
                                        value={name}
                                        autoFocus
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        variant="filled" // Use filled for a modern look
                                    />
                                )}

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                    value={username}
                                    autoFocus={view === "login"}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    variant="filled"
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete={
                                        view === "login"
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    variant="filled"
                                />

                                {error && (
                                    <Alert
                                        severity="error"
                                        sx={{ mt: 2, mb: 1 }}
                                    >
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        mb: 2,
                                        py: 1.5,
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        boxShadow:
                                            "0 4px 14px 0 rgb(56 189 248 / 39%)",
                                        "&:hover": {
                                            boxShadow: "none",
                                        },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress
                                            size={24}
                                            color="inherit"
                                        />
                                    ) : view === "login" ? (
                                        "Sign In"
                                    ) : (
                                        "Register"
                                    )}
                                </Button>

                                <Grid container>
                                    <Grid item xs>
                                        <Link
                                            href="#"
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Forgot password?
                                        </Link>
                                    </Grid>
                                </Grid>
                                <Copyright sx={{ mt: 5 }} />
                            </Box>
                        </Box>
                    </GlassPaper>
                </Grid>
            </Grid>

            {/* Snackbar for success messages */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={message}
            />
        </ThemeProvider>
    );
}
