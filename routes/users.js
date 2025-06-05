const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/owners', authMiddleware, async (req, res) => {
    try {
      const [users] = await pool.query(
        "SELECT permissions FROM users WHERE company_id = ?",
        [req.user.company_id]
      );
  
      let owners = [];
  
      for (const user of users) {
        if (user.permissions) {
          const perms = JSON.parse(user.permissions);
          owners = owners.concat(perms);
        }
      }
  
      owners = [...new Set(owners)];
  
      res.json(owners);
    } catch (error) {
      console.error('Error fetching owners:', error);
      res.status(500).json({ error: error.message });
    }
  });
  module.exports = router;

  