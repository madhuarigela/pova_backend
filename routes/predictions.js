const express = require('express');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const { calculatePredictions, isPeriodLate } = require('../utils/predictions');

const router = express.Router();

// GET /api/predictions - Get predictions for authenticated user
router.get('/', auth, async (req, res) => {
    try {
        let prediction = await Prediction.findOne({ userId: req.userId });

        // If no prediction exists, try to calculate
        if (!prediction) {
            prediction = await calculatePredictions(req.userId);
        }

        if (!prediction) {
            return res.json({
                message: 'Not enough data to make predictions. Log at least one cycle to get started!',
                prediction: null
            });
        }

        // Check if period is late
        const late = isPeriodLate(prediction.predictedNextPeriod);

        res.json({
            prediction,
            isLate: late,
            alert: late ? '⚠️ Your period appears to be late. This could be normal, but please monitor and consult a doctor if needed.' : null
        });
    } catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch predictions.' });
    }
});

// POST /api/predictions/recalculate - Force recalculation
router.post('/recalculate', auth, async (req, res) => {
    try {
        const prediction = await calculatePredictions(req.userId);

        if (!prediction) {
            return res.json({
                message: 'Not enough cycle data to calculate predictions.',
                prediction: null
            });
        }

        res.json({
            message: 'Predictions updated!',
            prediction
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to recalculate predictions.' });
    }
});

module.exports = router;
