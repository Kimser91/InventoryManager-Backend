const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 📌 Hent hele lagerbeholdningen
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM inventory");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Legg til et nytt produkt
router.post("/", async (req, res) => {
    const { product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO inventory (product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner, is_ordered) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [product_name, store_name, article_number, stock_quantity, min_threshold, max_stock, price, owner]
        );
        res.json({ message: "Produkt lagt til!", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Oppdater et produkt og reset `is_ordered` hvis nødvendig
router.put("/:id", async (req, res) => {
    const { stock_quantity, min_threshold, max_stock, price } = req.body;
    try {
        await pool.query(
            `UPDATE inventory 
             SET stock_quantity = ?, min_threshold = ?, max_stock = ?, price = ?, 
                 is_ordered = CASE 
                    WHEN ? >= min_threshold THEN FALSE 
                    ELSE is_ordered 
                 END
             WHERE id = ?`,
            [stock_quantity, min_threshold, max_stock, price, stock_quantity, req.params.id]
        );

        res.json({ message: "Produkt oppdatert!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Slett et produkt fra lageret
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM inventory WHERE id = ?", [req.params.id]);
        res.json({ message: "Produkt slettet!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Generer ordre, men unngå duplisering
router.post("/generate-orders", async (req, res) => {
    try {
        // Hent produkter som trenger påfyll men som ikke allerede er bestilt
        const [items] = await pool.query(`
            SELECT * FROM inventory 
            WHERE stock_quantity < min_threshold 
            AND is_ordered = FALSE
        `);

        if (items.length === 0) {
            return res.json({ message: "Ingen nye produkter trenger påfyll" });
        }

        for (const item of items) {
            // Sjekk om en ordre allerede eksisterer
            const [existingOrder] = await pool.query(
                "SELECT id FROM orders WHERE article_number = ? AND status = 'pending'",
                [item.article_number]
            );

            if (existingOrder.length === 0) {
                // Beregn bestillingsmengde
                const orderQuantity = item.max_stock - item.stock_quantity;

                // Legg til ny ordre
                await pool.query(
                    `INSERT INTO orders (product_name, store_name, article_number, quantity, owner, status) 
                     VALUES (?, ?, ?, ?, ?, 'pending')`,
                    [item.product_name, item.store_name, item.article_number, orderQuantity, item.owner]
                );

                // Oppdater produktets is_ordered-status til TRUE
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

module.exports = router;
