const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    predictedNextPeriod: {
        type: Date,
        required: true
    },
    predictedOvulation: {
        type: Date,
        default: null
    },
    fertilityWindowStart: {
        type: Date,
        default: null
    },
    fertilityWindowEnd: {
        type: Date,
        default: null
    },
    confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    basedOnCycles: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Prediction', predictionSchema);
