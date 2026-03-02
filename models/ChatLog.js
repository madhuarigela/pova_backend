const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    response: {
        type: String,
        required: true,
        maxlength: 2000
    }
}, {
    timestamps: true
});

// Keep only last 100 messages per user
chatLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);
