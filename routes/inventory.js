const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 


// Hent hele lagerbeholdningen
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM inventory");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legg til et nytt produkt
router.post("/", async (req, res) => {
    const { product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO inventory (product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner]
        );
        res.json({ message: "Produkt lagt til!", id: result[0].insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Oppdater et produkt
router.put("/:id", async (req, res) => {
    const { stock_quantity, min_threshold, max_stock, price } = req.body;
    try {
        await pool.query(
            "UPDATE inventory SET stock_quantity = ?, min_threshold = ?, max_stock = ?, price = ? WHERE id = ?",
            [stock_quantity, min_threshold, max_stock, price, req.params.id]
        );
        res.json({ message: "Produkt oppdatert!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Slett et produkt
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM inventory WHERE id = ?", [req.params.id]);
        res.json({ message: "Produkt slettet!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
