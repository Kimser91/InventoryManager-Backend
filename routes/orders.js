const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require('../middleware/authMiddleware');

// 📋 Hent alle ordrer
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Ingen tilgang, bruker ikke autentisert" });
    }

    let query;
    let params = [];

    if (req.user.role === 'Superadmin') {
      query = "SELECT * FROM orders";
    } else {
      query = "SELECT * FROM orders WHERE company_id = ?";
      params = [req.user.company_id];
    }

    const [orders] = await pool.query(query, params);
    res.json(orders);
  } catch (err) {
    console.error('Feil ved henting av ordrer:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Slett en ordre
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Ekstra sikkerhet: Kun slett ordre som tilhører riktig firma
    const [order] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);

    if (order.length === 0) {
      return res.status(404).json({ error: "Ordren finnes ikke" });
    }

    if (req.user.role !== 'Superadmin' && order[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: "Ingen tilgang til å slette denne ordren" });
    }

    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ message: "Ordre slettet!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Fullfør en ordre (oppdater lager og slett ordre)
router.put("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const [orderResult] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Ordren finnes ikke" });
    }

    const order = orderResult[0];

    if (req.user.role !== 'Superadmin' && order.company_id !== req.user.company_id) {
      return res.status(403).json({ error: "Ingen tilgang til å fullføre denne ordren" });
    }

    const { article_number, quantity, inventory_id, company_id } = order;

    await pool.query(
      `UPDATE inventory 
       SET stock_quantity = stock_quantity + ?, is_ordered = FALSE 
       WHERE id = ? AND article_number = ? AND company_id = ?`,
      [quantity, inventory_id, article_number, company_id]
    );

    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);

    res.json({ message: "Ordre fullført og lager oppdatert!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
