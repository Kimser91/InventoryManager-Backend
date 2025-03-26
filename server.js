require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
    res.send('Inventory Administrator API is running');
});

const orderRoutes = require('./routes/orders'); // 👈 Importer ruten
app.use('/api/orders', orderRoutes); // 👈 Bruk ruten


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
