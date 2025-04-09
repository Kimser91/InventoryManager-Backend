const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.company_id;

        await pool.query(
            `INSERT INTO requests (user_id, company_id, status, created_at) VALUES (?, ?, 'pending', NOW())`,
            [userId, companyId]
        );

        res.status(201).json({ message: 'Request created!' });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [requests] = await pool.query(`SELECT * FROM requests`);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/complete', authMiddleware, async (req, res) => {
    try {
      await pool.query(`UPDATE requests SET status = 'completed' WHERE id = ?`, [req.params.id]);
      res.json({ message: 'Request completed!' });
    } catch (error) {
      console.error('Error completing request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      await pool.query(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
      res.json({ message: 'Request deleted!' });
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  

module.exports = router;
