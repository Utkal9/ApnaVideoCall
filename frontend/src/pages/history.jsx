import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Typography,
    IconButton,
    Container,
    Paper,
    AppBar,
    Toolbar,
    CircularProgress,
    Grid,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import VideocamIcon from "@mui/icons-material/Videocam"; // Icon for Join button
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff"; // Icon for empty state

export default function History() {
    const { getHistoryOfUser, addToUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history.reverse()); // Newest first
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleRejoin = async (meetingCode) => {
        try {
            await addToUserHistory(meetingCode);
            routeTo(`/${meetingCode}`);
        } catch (err) {
            console.error("Failed to rejoin meeting:", err);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#111827", color: "white" }}>
            <AppBar
                position="static"
                sx={{
                    bgcolor: "rgba(17, 24, 39, 0.8)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="home"
                        onClick={() => routeTo("/")}
                        sx={{ mr: 1 }}
                    >
                        <HomeIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Meeting History
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container sx={{ py: 4 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "60vh",
                        }}
                    >
                        <CircularProgress color="primary" />
                    </Box>
                ) : meetings.length === 0 ? (
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            textAlign: "center",
                            bgcolor: "#1f2937",
                            color: "white",
                            mt: 4,
                            borderRadius: 2,
                        }}
                    >
                        <HistoryToggleOffIcon
                            sx={{ fontSize: 60, color: "#38bdf8", mb: 2 }}
                        />
                        <Typography
                            variant="h5"
                            sx={{ mb: 1, fontWeight: "600" }}
                        >
                            No History Found
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                            {/* --- FIX: Lighter text color --- */}
                            Join a meeting, and it will appear here.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => routeTo("/")}
                            sx={{
                                mt: 3,
                                bgcolor: "#38bdf8",
                                "&:hover": { bgcolor: "#22a0dc" },
                            }}
                            startIcon={<VideocamIcon />}
                        >
                            Go to Home
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {meetings.map((e) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={e._id}>
                                <Paper
                                    elevation={5}
                                    sx={{
                                        p: 3,
                                        bgcolor: "#1f2937",
                                        color: "white",
                                        borderRadius: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        height: "100%",
                                        transition:
                                            "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                        "&:hover": {
                                            transform: "translateY(-5px)",
                                            boxShadow:
                                                "0 8px 16px rgba(0,0,0,0.4)",
                                        },
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontFamily: "monospace",
                                                color: "#38bdf8",
                                                fontWeight: "bold",
                                                mb: 1,
                                                wordBreak: "break-all", // Ensure long codes wrap
                                            }}
                                        >
                                            {e.meetingCode}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 2,
                                                color: "rgba(255, 255, 255, 0.7)", // --- FIX: Lighter text color ---
                                            }}
                                        >
                                            {formatDate(e.date)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={() =>
                                            handleRejoin(e.meetingCode)
                                        }
                                        sx={{
                                            mt: "auto",
                                            bgcolor: "#38bdf8",
                                            "&:hover": {
                                                bgcolor: "#22a0dc",
                                            },
                                        }}
                                        startIcon={<VideocamIcon />}
                                    >
                                        Join
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
}
