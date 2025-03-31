require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');
const corsOptions = {
    origin: ['https://inventoryadministrator.com', 'https://www.inventoryadministrator.com', 'https://admin.inventoryadministrator.com', 'https://users.inventoryadministrator.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }

app.use(cors(corsOptions));

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
    res.send('Inventory Administrator API is running');
});

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes); 


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
