const express = require('express');
const { register, login, getUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute("SELECT id, username, email, role FROM users WHERE id = ?", [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
