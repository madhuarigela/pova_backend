const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    hashedPassword: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otpCode: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    cycleLength: {
        type: Number,
        default: 28,
        min: 21,
        max: 45
    },
    averagePeriodLength: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
    },
    consentGiven: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    pregnancyMode: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('hashedPassword')) return;
    const salt = await bcrypt.genSalt(12);
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.hashedPassword);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.hashedPassword;
    delete user.otpCode;
    delete user.otpExpires;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
