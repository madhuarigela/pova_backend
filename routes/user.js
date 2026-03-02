const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const CycleLog = require('../models/CycleLog');
const Prediction = require('../models/Prediction');
const ChatLog = require('../models/ChatLog');

const router = express.Router();

// GET /api/user/profile - Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user.toJSON());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, cycleLength, averagePeriodLength, darkMode, pregnancyMode } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (cycleLength !== undefined) updates.cycleLength = cycleLength;
        if (averagePeriodLength !== undefined) updates.averagePeriodLength = averagePeriodLength;
        if (darkMode !== undefined) updates.darkMode = darkMode;
        if (pregnancyMode !== undefined) updates.pregnancyMode = pregnancyMode;

        const user = await User.findByIdAndUpdate(
            req.userId,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Profile updated successfully!',
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// GET /api/user/export - Export all user data (GDPR)
router.get('/export', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cycles = await CycleLog.find({ userId: req.userId }).sort({ startDate: -1 });
        const predictions = await Prediction.findOne({ userId: req.userId });
        const chatHistory = await ChatLog.find({ userId: req.userId }).sort({ createdAt: -1 });

        const exportData = {
            exportDate: new Date().toISOString(),
            profile: user.toJSON(),
            cycleLogs: cycles,
            predictions: predictions || null,
            chatHistory: chatHistory
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=period-helper-data.json');
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export data.' });
    }
});

// DELETE /api/user/account - Delete account and all data (Right to be Forgotten)
router.delete('/account', auth, async (req, res) => {
    try {
        const { confirmEmail } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Require email confirmation for deletion
        if (confirmEmail !== user.email) {
            return res.status(400).json({ error: 'Please confirm your email to delete your account.' });
        }

        // Delete all user data
        await CycleLog.deleteMany({ userId: req.userId });
        await Prediction.deleteMany({ userId: req.userId });
        await ChatLog.deleteMany({ userId: req.userId });
        await User.findByIdAndDelete(req.userId);

        res.json({ message: 'Account and all associated data have been permanently deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account.' });
    }
});

// GET /api/user/dashboard - Get dashboard summary
router.get('/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const recentCycles = await CycleLog.find({ userId: req.userId })
            .sort({ startDate: -1 })
            .limit(3);
        const prediction = await Prediction.findOne({ userId: req.userId });

        // Calculate days until next period
        let daysUntilNextPeriod = null;
        let currentPhase = 'unknown';

        if (prediction) {
            const now = new Date();
            const nextPeriod = new Date(prediction.predictedNextPeriod);
            daysUntilNextPeriod = Math.round((nextPeriod - now) / (1000 * 60 * 60 * 24));

            // Determine current phase
            const ovulation = new Date(prediction.predictedOvulation);
            const fertStart = new Date(prediction.fertilityWindowStart);
            const fertEnd = new Date(prediction.fertilityWindowEnd);

            if (recentCycles.length > 0) {
                const lastCycle = recentCycles[0];
                const lastEnd = lastCycle.endDate ? new Date(lastCycle.endDate) : null;
                const lastStart = new Date(lastCycle.startDate);

                if (!lastEnd || now <= lastEnd) {
                    currentPhase = 'menstrual';
                } else if (now >= fertStart && now <= fertEnd) {
                    currentPhase = 'fertile';
                } else if (now < fertStart) {
                    currentPhase = 'follicular';
                } else {
                    currentPhase = 'luteal';
                }
            }
        }

        res.json({
            user: user.toJSON(),
            recentCycles,
            prediction,
            daysUntilNextPeriod,
            currentPhase,
            totalCyclesLogged: await CycleLog.countDocuments({ userId: req.userId })
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

module.exports = router;
