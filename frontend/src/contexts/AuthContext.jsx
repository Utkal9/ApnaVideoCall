import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useEffect } from "react"; // No change here
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
    // 1. SET INITIAL USER DATA TO NULL
    const [userData, setUserData] = useState(null);
    // 2. ADD LOADING STATE, START AS TRUE
    const [loading, setLoading] = useState(true);
    const router = useNavigate();

    // 3. THIS IS THE AUTO-LOGOUT INTERCEPTOR (YOUR CODE IS PERFECT)
    useEffect(() => {
        const requestInterceptor = client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.log("Session expired, logging out.");
                    localStorage.removeItem("token");
                    setUserData(null);
                    router("/auth", { replace: true });
                }
                return Promise.reject(error);
            }
        );

        return () => {
            client.interceptors.request.eject(requestInterceptor);
            client.interceptors.response.eject(responseInterceptor);
        };
    }, [router]);

    // 4. --- ADD THIS NEW VALIDATION HOOK ---
    // This runs ONCE when the app loads to check the token
    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    // We "ping" the server by fetching history.
                    // If the token is bad, the interceptor will catch the 401
                    // and log the user out automatically.
                    await getHistoryOfUser();
                } catch (error) {
                    // Interceptor handles the 401.
                    // If it's another error, we don't block the app.
                    console.log("Token validation failed.");
                }
            }
            // 5. After the check, set loading to false
            setLoading(false);
        };

        validateToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array ensures this runs only ONCE

    // --- (handleRegister is unchanged) ---
    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    // --- (handleLogin is unchanged) ---
    const handleLogin = async (username, password, redirectPath) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password,
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                const destination = redirectPath || "/";
                router(destination, { replace: true });
            }
        } catch (err) {
            throw err;
        }
    };

    // --- (getHistoryOfUser is unchanged) ---
    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity");
            return request.data;
        } catch (err) {
            throw err;
        }
    };

    // --- (addToUserHistory is unchanged) ---
    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                meeting_code: meetingCode,
            });
            return request;
        } catch (e) {
            throw e;
        }
    };

    // 6. --- PROVIDE THE LOADING STATE ---
    const data = {
        userData,
        setUserData,
        loading, // Pass the loading state
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
    };

    return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
