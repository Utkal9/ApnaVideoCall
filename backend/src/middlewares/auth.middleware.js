import { User } from "../models/user.model.js";
import httpStatus from "http-status";

const authMiddleware = async (req, res, next) => {
    let token;

    // 1. Get the token from the "Authorization: Bearer <token>" header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ message: "No token provided, authorization denied" });
    }

    try {
        // 2. Find the user by the token
        const user = await User.findOne({ token: token });

        if (!user) {
            // 3. THIS IS THE FIX: Send a 401 if the token is old/invalid
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Session expired or invalid token" });
        }

        // 4. Token is valid! Attach the user to the request
        req.user = user;
        next(); // Move on to the actual controller
    } catch (e) {
        res.status(500).json({ message: `Something went wrong ${e}` });
    }
};

export { authMiddleware };
