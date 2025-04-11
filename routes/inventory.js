const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require('../middleware/authMiddleware');
const { Script } = require("vm");

// 📦 Hent hele lagerbeholdningen
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'Superadmin') {
      query = "SELECT * FROM inventory";
    } else {
      query = "SELECT * FROM inventory WHERE company_id = ?";
      params = [req.user.company_id];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO inventory 
       (product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner, company_id, is_ordered) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner || ' ', req.user.company_id]
    );
    res.json({ message: "Produkt lagt til!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner } = req.body;
  try {
    await pool.query(
      `UPDATE inventory 
       SET 
         product_name = ?, 
         store_name = ?, 
         article_number = ?, 
         stock_quantity = ?, 
         min_threshold = ?, 
         max_stock = ?, 
         price = ?, 
         owner = ?, 
         is_ordered = CASE WHEN ? >= min_threshold THEN FALSE ELSE is_ordered END 
       WHERE id = ? AND company_id = ?`,
      [
        product_name,
        store_name,
        article_number,
        stock_quantity,
        min_threshold,
        max_stock,
        price,
        owner || ' ',
        stock_quantity,
        req.params.id,
        req.user.company_id
      ]
    );
    res.json({ message: "Produkt oppdatert!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM inventory WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    res.json({ message: "Produkt slettet!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate-orders", authMiddleware, async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT * FROM inventory 
      WHERE stock_quantity < min_threshold 
      AND is_ordered = FALSE 
      AND company_id = ?`,
      [req.user.company_id]
    );

    if (items.length === 0) {
      return res.json({ message: "Ingen produkter trenger påfyll." });
    }

    for (const item of items) {
      const [existingOrder] = await pool.query(
        "SELECT id FROM orders WHERE article_number = ? AND status = 'pending' AND company_id = ?",
        [item.article_number, req.user.company_id]
      );

      if (existingOrder.length === 0) {
        const orderQuantity = item.max_stock - item.stock_quantity;

        await pool.query(
          `INSERT INTO orders (product_name, store_name, article_number, quantity, owner, company_id, status) 
           VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [item.product_name, item.store_name, item.article_number, orderQuantity, item.owner, req.user.company_id]
        );

        await pool.query(
          `UPDATE inventory SET is_ordered = TRUE WHERE id = ?`,
          [item.id]
        );
      }
    }

   res.json({ message: "Bestillinger generert!" });
  } catch (error) {
    console.error("Error generating orders:", error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/:id/clone", authMiddleware, async (req, res) => {
  const { newOwners } = req.body; 
  const { id } = req.params;

  if (!Array.isArray(newOwners) || newOwners.length === 0) {
    return res.status(400).json({ error: "No owners provided for cloning" });
  }

  try {
    const [products] = await pool.query(
      "SELECT * FROM inventory WHERE id = ? AND company_id = ?",
      [id, req.user.company_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = products[0];

    for (const newOwner of newOwners) {
      const [existing] = await pool.query(
        "SELECT id FROM inventory WHERE article_number = ? AND owner = ? AND company_id = ?",
        [product.article_number, newOwner, req.user.company_id]
      );

      if (existing.length > 0) {
        console.log(`⚠️ Product already exists for owner: ${newOwner}`);
        continue;
      }

      await pool.query(
        `INSERT INTO inventory 
          (product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner, company_id, is_ordered)
         VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, FALSE)`,
        [
          product.product_name,
          product.store_name,
          product.article_number,
          product.min_threshold,
          product.max_stock,
          product.price,
          newOwner,
          req.user.company_id
        ]
      );
    }

    res.json({ message: "Product cloned successfully to selected owners!" });
  } catch (error) {
    console.error("❌ Error cloning product:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
