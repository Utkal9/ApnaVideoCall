// src/auth.js

/**
 * Checks if a user is authenticated by looking for the token
 * you already set in localStorage.
 */
export const checkAuth = () => {
    const token = localStorage.getItem("token");

    // !!token converts the string (or null) to a boolean
    return !!token;
};
