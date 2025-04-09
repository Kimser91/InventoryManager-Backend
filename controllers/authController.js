
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        console.log("jeg har kommet til authController")
        const { username, email, password, companyName } = req.body;
        console.log("company name: ", req.body)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [companyResult] = await pool.execute( "INSERT INTO companies (name) VALUES (?)", [companyName]);

        const companyId = companyResult.insertId;

        console.log("Company ID: ", companyId);

        await pool.execute(
            "INSERT INTO users (username, email, password_hash, role, company_id) VALUES (?, ?, ?, 'Hovedadmin', ?)",
            [username, email, hashedPassword, companyId]
        );

        res.status(201).json({ message: "Hovedadmin opprettet med firma!" });
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

exports.getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute("SELECT id, username, email, role, permissions, can_see_all FROM users WHERE id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }

        const user = rows[0];

        if (user.permissions && typeof user.permissions === 'string' && !user.permissions.startsWith('[')) {
            user.permissions = JSON.stringify([user.permissions]);
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
