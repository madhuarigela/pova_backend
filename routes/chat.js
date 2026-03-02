const express = require('express');
const auth = require('../middleware/auth');
const ChatLog = require('../models/ChatLog');
const Prediction = require('../models/Prediction');
const { getAmmaResponse } = require('../utils/ammaBot');

const router = express.Router();

// POST /api/chat - Send a message to Amma
router.post('/', auth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });
        }

        // Get user's cycle data for context
        let cycleData = null;
        const prediction = await Prediction.findOne({ userId: req.userId });
        if (prediction) {
            const now = new Date();
            const nextPeriod = new Date(prediction.predictedNextPeriod);
            const daysUntil = Math.round((nextPeriod - now) / (1000 * 60 * 60 * 24));
            cycleData = {
                daysUntilNextPeriod: daysUntil,
                predictedNextPeriod: prediction.predictedNextPeriod,
                predictedOvulation: prediction.predictedOvulation
            };
        }

        // Get Amma's response
        const response = getAmmaResponse(message, cycleData);

        // Save chat log
        const chatLog = new ChatLog({
            userId: req.userId,
            message: message.trim(),
            response
        });
        await chatLog.save();

        res.json({
            message: message.trim(),
            response,
            timestamp: chatLog.createdAt
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process message.' });
    }
});

// GET /api/chat/history - Get chat history
router.get('/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await ChatLog.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Reverse to show oldest first
        messages.reverse();

        const total = await ChatLog.countDocuments({ userId: req.userId });

        res.json({
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history.' });
    }
});

// DELETE /api/chat/history - Clear chat history
router.delete('/history', auth, async (req, res) => {
    try {
        await ChatLog.deleteMany({ userId: req.userId });
        res.json({ message: 'Chat history cleared.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear chat history.' });
    }
});

module.exports = router;
