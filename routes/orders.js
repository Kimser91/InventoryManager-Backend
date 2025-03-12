const express = require('express');
const router = express.Router();

// Dummy endpoint for orders
router.get('/', (req, res) => {
    res.json({ message: "Orders API is working!" });
});

module.exports = router;
