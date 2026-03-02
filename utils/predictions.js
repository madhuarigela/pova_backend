const CycleLog = require('../models/CycleLog');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

/**
 * Calculate predictions based on user's cycle history
 */
async function calculatePredictions(userId) {
    try {
        // Get the last 6 cycles, sorted by start date descending
        const cycles = await CycleLog.find({ userId, endDate: { $ne: null } })
            .sort({ startDate: -1 })
            .limit(6);

        if (cycles.length < 1) {
            return null;
        }

        const user = await User.findById(userId);
        let avgCycleLength = user.cycleLength || 28;
        let avgPeriodLength = user.averagePeriodLength || 5;
        let confidenceScore = 30;

        // Calculate average cycle length from actual data
        if (cycles.length >= 2) {
            const cycleLengths = [];
            for (let i = 0; i < cycles.length - 1; i++) {
                const diff = Math.round(
                    (new Date(cycles[i].startDate) - new Date(cycles[i + 1].startDate)) / (1000 * 60 * 60 * 24)
                );
                if (diff > 0 && diff <= 60) {
                    cycleLengths.push(diff);
                }
            }

            if (cycleLengths.length > 0) {
                avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
                confidenceScore = Math.min(95, 40 + (cycleLengths.length * 10));
            }
        }

        // Calculate average period length from actual data
        const periodLengths = cycles
            .filter(c => c.endDate)
            .map(c => Math.round(
                (new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24)
            ))
            .filter(d => d > 0 && d <= 15);

        if (periodLengths.length > 0) {
            avgPeriodLength = Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length);
        }

        // Most recent cycle start date
        const lastPeriodStart = new Date(cycles[0].startDate);

        // Predicted next period
        const predictedNextPeriod = new Date(lastPeriodStart);
        predictedNextPeriod.setDate(predictedNextPeriod.getDate() + avgCycleLength);

        // Ovulation typically occurs 14 days before the next period
        const predictedOvulation = new Date(predictedNextPeriod);
        predictedOvulation.setDate(predictedOvulation.getDate() - 14);

        // Fertility window: 5 days before ovulation to 1 day after
        const fertilityWindowStart = new Date(predictedOvulation);
        fertilityWindowStart.setDate(fertilityWindowStart.getDate() - 5);

        const fertilityWindowEnd = new Date(predictedOvulation);
        fertilityWindowEnd.setDate(fertilityWindowEnd.getDate() + 1);

        // Update or create prediction
        const prediction = await Prediction.findOneAndUpdate(
            { userId },
            {
                userId,
                predictedNextPeriod,
                predictedOvulation,
                fertilityWindowStart,
                fertilityWindowEnd,
                confidenceScore,
                basedOnCycles: cycles.length
            },
            { upsert: true, new: true }
        );

        // Update user's average cycle info
        await User.findByIdAndUpdate(userId, {
            cycleLength: avgCycleLength,
            averagePeriodLength: avgPeriodLength
        });

        return prediction;
    } catch (error) {
        console.error('Prediction calculation error:', error);
        return null;
    }
}

/**
 * Check if a period is late
 */
function isPeriodLate(predictedDate) {
    const now = new Date();
    const predicted = new Date(predictedDate);
    const diffDays = Math.round((now - predicted) / (1000 * 60 * 60 * 24));
    return diffDays > 3; // Consider late if more than 3 days past predicted
}

module.exports = { calculatePredictions, isPeriodLate };
