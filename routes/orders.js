const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 📌 Hent alle ordrer
router.get("/", async (req, res) => {
    try {
        const [orders] = await pool.query("SELECT * FROM orders");
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Slett en ordre
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
        res.json({ message: "Order deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Fullfør en ordre og oppdater lagerstatus
router.put("/:id/complete", async (req, res) => {
    try {
        // Hent ordren som skal fullføres
        const [order] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);

        if (order.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        const { article_number, quantity } = order[0];

        // Oppdater lagerbeholdningen
        await pool.query(
            `UPDATE inventory 
             SET stock_quantity = stock_quantity + ?, is_ordered = FALSE 
             WHERE article_number = ?`,
            [quantity, article_number]
        );

        // Slett ordren etter at lageret er oppdatert
        await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);

        res.json({ message: "Order completed and stock updated!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

