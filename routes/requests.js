const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, async (req, res) => {
  try {
      const userId = req.user.id;
      const companyId = req.user.company_id;
      const {
          product_name,
          store_name,
          article_number,
          stock_quantity,
          min_threshold,
          max_stock,
          price
      } = req.body;

      if (!product_name || !store_name || !article_number || !stock_quantity || !min_threshold || !max_stock || !price) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      await pool.query(
          `INSERT INTO requests (user_id, company_id, product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', NOW())`,
          [userId, companyId, product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price]
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
