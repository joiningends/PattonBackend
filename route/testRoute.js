import express from 'express';
import authenticateUser from '../middleware/authMiddleware.js';


const router = express.Router();

router.get("/protected", authenticateUser, async (req, res, next) => {
    try {
        const data = req.user;

        res.status(200).json({
            message: "Authentication works fine.",
            data,
        })
    } catch (error) {
        console.error("Error details: ", error);
    }
});


export default router;