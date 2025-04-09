const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/users', authMiddleware, async (req, res) => {
    try {
      let query;
      let params = [];
  
      if (req.user.role === 'Superadmin') {
        query = "SELECT id, username, email, role, company_id FROM users";
      } else {
        query = "SELECT id, username, email, role FROM users WHERE company_id = ?";
        params = [req.user.company_id];
      }
  
      const [users] = await pool.query(query, params);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
router.post('/users', authMiddleware, async (req, res) => {
    try {
        const { username, email, password, role, permissions, can_see_all } = req.body;

        if (role === 'Superadmin') {
            return res.status(403).json({ message: "Ikke lov å lage en Superadmin-bruker" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.execute(
            "INSERT INTO users (username, email, password_hash, role, company_id, permissions, can_see_all) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [username, email, hashedPassword, role, req.user.company_id, JSON.stringify(permissions || []), can_see_all ? 1 : 0]
        );

        res.status(201).json({ message: "Bruker opprettet!" });
    } catch (error) {
        console.error("❌ Feil ved opprettelse av bruker:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/:id', authMiddleware, async (req, res) => {
    try {
        const { username, email, role, permissions, can_see_all } = req.body;

        if (role === 'Superadmin') {
            return res.status(403).json({ message: "Ikke lov å oppdatere eller lage Superadmin-bruker" });
        }

        await pool.execute(
            "UPDATE users SET username = ?, email = ?, role = ?, permissions = ?, can_see_all = ? WHERE id = ? AND company_id = ?",
            [
                username,
                email,
                role,
                JSON.stringify(permissions || []),
                can_see_all ? 1 : 0,
                req.params.id,
                req.user.company_id
            ]
        );

        res.json({ message: "Bruker oppdatert!" });
    } catch (error) {
        console.error("❌ Feil ved oppdatering av bruker:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/:id/password', authMiddleware, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.execute(
            "UPDATE users SET password_hash = ? WHERE id = ? AND company_id = ?",
            [hashedPassword, req.params.id, req.user.company_id]
        );

        res.json({ message: "Passord oppdatert!" });
    } catch (error) {
        console.error("❌ Feil ved endring av passord:", error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        await pool.execute(
            "DELETE FROM users WHERE id = ? AND company_id = ?",
            [req.params.id, req.user.company_id]
        );

        res.json({ message: "Bruker slettet!" });
    } catch (error) {
        console.error("❌ Feil ved sletting av bruker:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
