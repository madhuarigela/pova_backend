const mongoose = require('mongoose');

const cycleLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    flowIntensity: {
        type: String,
        enum: ['light', 'medium', 'heavy', 'spotting'],
        default: 'medium'
    },
    symptoms: [{
        type: String,
        enum: [
            'cramps', 'headache', 'bloating', 'fatigue',
            'backache', 'breast_tenderness', 'nausea',
            'acne', 'insomnia', 'dizziness', 'hot_flashes',
            'appetite_changes', 'constipation', 'diarrhea'
        ]
    }],
    mood: {
        type: String,
        enum: ['happy', 'calm', 'anxious', 'irritable', 'sad', 'energetic', 'tired', 'emotional', 'neutral'],
        default: 'neutral'
    },
    notes: {
        type: String,
        maxlength: 500,
        default: ''
    }
}, {
    timestamps: true
});

// Index for efficient date-range queries
cycleLogSchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model('CycleLog', cycleLogSchema);
