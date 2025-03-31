const express = require('express');
//const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/db');

const router = express.Router();

// Hent alle brukere tilknyttet `company_id`
/*router.get('/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'Hovedadmin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Ingen tilgang" });
        }

        // Hent brukere i samme selskap
        const [users] = await pool.execute(
            "SELECT id, username, email, role FROM users WHERE company_id = ?",
            [req.user.company_id]
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});*/

// Hent alle brukere tilknyttet `company_id`
router.get('/users', /*authMiddleware,*/ async (req, res) => {
    try {
        // Her kan du hardkode company_id midlertidig
        const testCompanyId = 1;
        // const testRole = 'Hovedadmin';

        // Simulerer en user-verifikasjon:
        // if (testRole !== 'Hovedadmin' && testRole !== 'Admin') {
        //     return res.status(403).json({ message: "Ingen tilgang" });
        // }

        // Hent brukere i samme selskap
        const [users] = await pool.execute(
            "SELECT id, username, email, role FROM users WHERE company_id = ?",
            [testCompanyId]
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
