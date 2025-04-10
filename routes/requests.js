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
      price,
      quantity
    } = req.body;

    if (!article_number) {
      return res.status(400).json({ error: 'Article number is required.' });
    }

    if (product_name && store_name && stock_quantity !== undefined && min_threshold !== undefined && max_stock !== undefined && price !== undefined) {

      await pool.query(
        `INSERT INTO requests 
         (user_id, company_id, product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, quantity, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', NOW())`,
        [userId, companyId, product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, quantity || 1]
      );
    } else {

      await pool.query(
        `INSERT INTO requests 
         (user_id, company_id, article_number, quantity, status, created_at)
         VALUES (?, ?, ?, ?, 'requested', NOW())`,
        [userId, companyId, article_number, quantity || 1]
      );
    }

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
  const connection = await pool.getConnection();
  try {
    const requestId = req.params.id;

    await connection.beginTransaction();

    const [requests] = await connection.query(`SELECT * FROM requests WHERE id = ?`, [requestId]);
    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }
    const request = requests[0];

    const [products] = await connection.query(`SELECT * FROM inventory WHERE article_number = ?`, [request.article_number]);

    if (products.length > 0) {
      await connection.query(
        `UPDATE inventory 
         SET stock_quantity = stock_quantity + ?, 
             is_ordered = FALSE 
         WHERE article_number = ?`,
        [request.quantity || 0, request.article_number]
      );
    } else {
      await connection.query(
        `INSERT INTO inventory 
         (product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner, is_ordered, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
        [
          request.product_name,
          request.store_name,
          request.article_number,
          request.stock_quantity || 0,
          request.min_threshold || 1,
          request.max_stock || 10,
          request.price || 0,
          request.store_name || 'Unknown',
          request.company_id
        ]
      );
    }

    await connection.query(`DELETE FROM requests WHERE id = ?`, [requestId]);
    await connection.commit();

    res.json({ message: 'Request processed and completed successfully!' });

  } catch (error) {
    console.error('Error completing request:', error);
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
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
