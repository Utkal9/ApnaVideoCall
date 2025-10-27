import React, { useContext, useState } from "react";
// 1. REMOVED withAuth - it's redundant with ProtectedRoute
import { useNavigate } from "react-router-dom";
import {
    Button,
    TextField,
    Container,
    Paper,
    Box,
    Typography,
    Grid,
} from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";
// 2. Import the new Navbar
import Navbar from "./Navbar";
import "../App.css"; // Keep your existing styles

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) {
            alert("Please enter a meeting code.");
            return;
        }
        await addToUserHistory(meetingCode.trim());
        navigate(`/${meetingCode.trim()}`);
    };

    return (
        <>
            {/* 3. Render the new Navbar */}
            <Navbar />

            {/* 4. Use MUI components for a clean layout */}
            <Container
                maxWidth="lg"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    py: { xs: 4, md: 8 },
                }}
            >
                <Grid
                    container
                    spacing={4}
                    alignItems="center"
                    justifyContent="center"
                >
                    {/* Left Panel */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ pr: { md: 4 } }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                fontWeight="bold"
                                gutterBottom
                            >
                                Quality Video Calls
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                paragraph
                            >
                                Enter a meeting code to join a call or start a
                                new one.
                            </Typography>

                            {/* Join Call Form */}
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 3,
                                    mt: 3,
                                    display: "flex",
                                    gap: 2,
                                    borderRadius: "12px",
                                }}
                            >
                                <TextField
                                    fullWidth
                                    onChange={(e) =>
                                        setMeetingCode(e.target.value)
                                    }
                                    value={meetingCode}
                                    id="outlined-basic"
                                    label="Meeting Code"
                                    variant="outlined"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        handleJoinVideoCall()
                                    }
                                />
                                <Button
                                    onClick={handleJoinVideoCall}
                                    variant="contained"
                                    size="large"
                                    sx={{ py: "15px", px: 4 }}
                                >
                                    Join
                                </Button>
                            </Paper>
                        </Box>
                    </Grid>

                    {/* Right Panel (Image) */}
                    <Grid item xs={12} md={6}>
                        <img
                            src="/logo3.png" // Assumes logo3.png is in your /public folder
                            alt="Video Call"
                            style={{
                                width: "100%",
                                maxWidth: "500px",
                                height: "auto",
                                borderRadius: "16px",
                            }}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}

// 5. Export directly, no withAuth needed
export default HomeComponent;
