const express = require('express');
const auth = require('../middleware/auth');
const CycleLog = require('../models/CycleLog');
const { calculatePredictions } = require('../utils/predictions');

const router = express.Router();

// GET /api/cycles - Get all cycle logs for authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const cycles = await CycleLog.find({ userId: req.userId })
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CycleLog.countDocuments({ userId: req.userId });

        res.json({
            cycles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get cycles error:', error);
        res.status(500).json({ error: 'Failed to fetch cycle logs.' });
    }
});

// GET /api/cycles/:id - Get a single cycle log
router.get('/:id', auth, async (req, res) => {
    try {
        const cycle = await CycleLog.findOne({ _id: req.params.id, userId: req.userId });
        if (!cycle) {
            return res.status(404).json({ error: 'Cycle log not found.' });
        }
        res.json(cycle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cycle log.' });
    }
});

// POST /api/cycles - Create a new cycle log
router.post('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, flowIntensity, symptoms, mood, notes } = req.body;

        if (!startDate) {
            return res.status(400).json({ error: 'Start date is required.' });
        }

        const cycle = new CycleLog({
            userId: req.userId,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            flowIntensity: flowIntensity || 'medium',
            symptoms: symptoms || [],
            mood: mood || 'neutral',
            notes: notes || ''
        });

        await cycle.save();

        // Recalculate predictions
        await calculatePredictions(req.userId);

        res.status(201).json({
            message: 'Cycle logged successfully!',
            cycle
        });
    } catch (error) {
        console.error('Create cycle error:', error);
        res.status(500).json({ error: 'Failed to log cycle.' });
    }
});

// PUT /api/cycles/:id - Update a cycle log
router.put('/:id', auth, async (req, res) => {
    try {
        const { startDate, endDate, flowIntensity, symptoms, mood, notes } = req.body;

        const cycle = await CycleLog.findOne({ _id: req.params.id, userId: req.userId });
        if (!cycle) {
            return res.status(404).json({ error: 'Cycle log not found.' });
        }

        if (startDate) cycle.startDate = new Date(startDate);
        if (endDate !== undefined) cycle.endDate = endDate ? new Date(endDate) : null;
        if (flowIntensity) cycle.flowIntensity = flowIntensity;
        if (symptoms) cycle.symptoms = symptoms;
        if (mood) cycle.mood = mood;
        if (notes !== undefined) cycle.notes = notes;

        await cycle.save();

        // Recalculate predictions
        await calculatePredictions(req.userId);

        res.json({
            message: 'Cycle updated successfully!',
            cycle
        });
    } catch (error) {
        console.error('Update cycle error:', error);
        res.status(500).json({ error: 'Failed to update cycle log.' });
    }
});

// DELETE /api/cycles/:id - Delete a cycle log
router.delete('/:id', auth, async (req, res) => {
    try {
        const cycle = await CycleLog.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!cycle) {
            return res.status(404).json({ error: 'Cycle log not found.' });
        }

        // Recalculate predictions
        await calculatePredictions(req.userId);

        res.json({ message: 'Cycle log deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete cycle log.' });
    }
});

// GET /api/cycles/range/:start/:end - Get cycles in a date range (for calendar)
router.get('/range/:start/:end', auth, async (req, res) => {
    try {
        const startDate = new Date(req.params.start);
        const endDate = new Date(req.params.end);

        const cycles = await CycleLog.find({
            userId: req.userId,
            $or: [
                { startDate: { $gte: startDate, $lte: endDate } },
                { endDate: { $gte: startDate, $lte: endDate } },
                { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
            ]
        }).sort({ startDate: 1 });

        res.json(cycles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cycles for range.' });
    }
});

module.exports = router;
