
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        console.log("jeg har kommet til authController")
        const { username, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let companyId;

        // Sjekk om det allerede finnes noen brukere
        const [existingCompanies] = await pool.execute("SELECT MAX(company_id) AS maxCompanyId FROM users");

        if (existingCompanies.length > 0 && existingCompanies[0].maxCompanyId !== null) {
            companyId = existingCompanies[0].maxCompanyId + 1; // 👈 Legg til 1 på høyeste company_id
        } else {
            companyId = 1; // Første bruker -> company_id = 1
        }

        console.log("Setter company_id:", companyId);

        await pool.execute(
            "INSERT INTO users (username, email, password_hash, role, company_id) VALUES (?, ?, ?, 'Hovedadmin', ?)",
            [username, email, hashedPassword, companyId]
        );

        res.status(201).json({ message: "Hovedadmin opprettet!" });
    } catch (error) {
        console.error("❌ Feil ved registrering:", error);
        res.status(500).json({ error: error.message });
    }
};


// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.execute(
            "SELECT id, username, email, role, company_id, password_hash FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Ugyldig e-post eller passord" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Ugyldig e-post eller passord" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, company_id: user.company_id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                company_id: user.company_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Hent bruker (beskyttet rute)
exports.getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute("SELECT id, username, email, role FROM users WHERE id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
