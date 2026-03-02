const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set("trust proxy", 1);

app.use(express.json());

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const cycleRoutes = require('./routes/cycles');
const predictionRoutes = require('./routes/predictions');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((error) => console.error('❌ MongoDB connection failed:', error.message));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
