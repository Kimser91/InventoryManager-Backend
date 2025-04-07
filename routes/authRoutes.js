const express = require('express');
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/db');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.execute(
            "SELECT id, username, email, role, permissions, can_see_all FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }

        res.json(users[0]);
    } catch (error) {
        console.error("❌ Feil ved henting av bruker:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
