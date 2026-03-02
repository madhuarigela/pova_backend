const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Generate OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Generate tokens
function generateTokens(userId) {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
    try {
        const { email, password, name, consentGiven } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        if (!consentGiven) {
            return res.status(400).json({ error: 'You must consent to data collection to use this app.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            hashedPassword: password, // Will be hashed by pre-save hook
            name: name || '',
            otpCode: otp,
            otpExpires: otpExpiry,
            consentGiven: true
        });

        await user.save();

        // Send OTP email
        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL || 'noreply@periodhelper.com',
                to: email,
                subject: 'Period Helper - Verify Your Email',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #EC4899;">Period Helper 🌸</h2>
            <p>Welcome! Your verification code is:</p>
            <div style="background: #FDF2F8; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #BE185D; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
            <p style="color: #9CA3AF; font-size: 12px;">If you didn't sign up for Period Helper, please ignore this email.</p>
          </div>
        `
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Still allow signup, user can request resend
        }

        console.log(`OTP for ${email}: ${otp}`); // Dev fallback

        res.status(201).json({
            message: 'Account created! Please verify your email with the OTP sent.',
            userId: user._id
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email is already verified.' });
        }

        if (user.otpCode !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Verify user
        user.isVerified = true;
        user.otpCode = null;
        user.otpExpires = null;

        // Generate tokens
        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            message: 'Email verified successfully!',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email is already verified.' });
        }

        const otp = generateOTP();
        user.otpCode = otp;
        user.otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);
        await user.save();

        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL || 'noreply@periodhelper.com',
                to: email,
                subject: 'Period Helper - New Verification Code',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #EC4899;">Period Helper 🌸</h2>
            <p>Your new verification code is:</p>
            <div style="background: #FDF2F8; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #BE185D; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          </div>
        `
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        console.log(`New OTP for ${email}: ${otp}`);

        res.json({ message: 'New OTP sent to your email.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend OTP.' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in.',
                needsVerification: true
            });
        }

        // Generate tokens
        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            message: 'Login successful!',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required.' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ error: 'Invalid refresh token.' });
        }

        // Rotate tokens
        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
        }

        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.json({ message: 'Logged out.' });
    }
});

module.exports = router;
