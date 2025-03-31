
const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');
const pool = require('../config/db')
require('dotenv').config();

// Registrering av Hovedadmin (kun første bruker)
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'Hovedadmin'");
        if (rows[0].count > 0) {
            return res.status(403).json({ message: "Hovedadmin er allerede opprettet. Kun admin kan lage nye brukere." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'Hovedadmin')",
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "Hovedadmin opprettet!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("📩 Login request mottatt for:", email);

        const [users] = await pool.execute(
            "SELECT id, username, email, role, company_id, password_hash FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            console.log("❌ Ingen bruker funnet med e-posten:", email);
            return res.status(401).json({ message: "Ugyldig e-post eller passord" });
        }

        const user = users[0];

        console.log("🔍 Bruker funnet i databasen:", user);

        if (!user.password_hash) {
            console.log("❌ Feil: password_hash er undefined!");
            return res.status(500).json({ error: "Serverfeil: Manglende passord i databasen." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log("❌ Feil passord for bruker:", email);
            return res.status(401).json({ message: "Ugyldig e-post eller passord" });
        }

        if (!user.company_id) {
            console.log("❌ Feil: company_id er undefined!");
            return res.status(500).json({ error: "Serverfeil: Manglende company_id i databasen." });
        }
/*
        if (!process.env.JWT_SECRET) {
            console.log("❌ Feil: JWT_SECRET er undefined!");
            return res.status(500).json({ error: "Serverfeil: JWT_SECRET mangler i .env-filen." });
        }*/

        // Generer JWT-token
       /* const token = jwt.sign(
            { id: user.id, role: user.role, company_id: user.company_id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );*/

        /*console.log("✅ Token generert for:", email);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                company_id: user.company_id
            }
        });*/

        res.json({
            id: 1,
            username: "TestUser",
            email: "test@example.com",
            role: "Admin"
        });

    } catch (error) {
        console.log("🔥 Feil i login:", error.message);
        res.status(500).json({ error: error.message });
    }
};



// Hent brukerinformasjon (krever JWT)
/*exports.getUser = async (req, res) => {
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
};*/

exports.getUser = async (req, res) => {
    try {
        // Her kan du hardkode en test-ID eller hente en bruker direkte uten å bruke req.user
        const testUserId = 1; // Eller en annen ID du vet eksisterer i databasen
        const [rows] = await pool.execute("SELECT id, username, email, role FROM users WHERE id = ?", [testUserId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bruker ikke funnet" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



