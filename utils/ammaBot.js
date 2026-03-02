/**
 * Amma - AI Health Assistant (Rule-Based Engine)
 * Provides contextual, empathetic responses about menstrual health
 * with medical disclaimers on every response.
 */

const DISCLAIMER = '\n\n⚠️ *Disclaimer: This information is for educational purposes only and does not replace professional medical advice. Please consult a healthcare provider for personalized guidance.*';

const responses = {
    // Greetings
    greetings: [
        "Hello! I'm Amma, your period health companion 🌸 How can I help you today?",
        "Hi there! I'm here to help with any period-related questions. What's on your mind? 💕",
        "Welcome! I'm Amma, and I'm here to support you. Ask me anything about your cycle! 🌷"
    ],

    // Period pain / cramps
    cramps: [
        "Period cramps can be really uncomfortable 💗 Here are some tips that may help:\n\n" +
        "• Apply a warm heating pad to your lower abdomen\n" +
        "• Try gentle stretching or yoga poses like child's pose\n" +
        "• Stay hydrated with warm water or herbal tea\n" +
        "• Over-the-counter pain relievers like ibuprofen can help (take as directed)\n" +
        "• Light exercise can actually reduce cramping\n\n" +
        "If your cramps are severe enough to interfere with daily activities, please see a doctor."
    ],

    // PMS
    pms: [
        "PMS symptoms are very common and can vary from person to person 🌿 Here are some ways to manage:\n\n" +
        "• **Mood swings**: Practice deep breathing, meditation, or journaling\n" +
        "• **Bloating**: Reduce salt intake and stay hydrated\n" +
        "• **Fatigue**: Prioritize sleep and consider iron-rich foods\n" +
        "• **Cravings**: Choose dark chocolate over milk chocolate for magnesium\n" +
        "• **Breast tenderness**: Wear a supportive bra and reduce caffeine\n\n" +
        "Tracking your symptoms helps identify patterns and prepare better for each cycle."
    ],

    // Diet
    diet: [
        "Good nutrition can really help during your period 🥗 Here are some recommendations:\n\n" +
        "**Iron-rich foods** (to replenish what's lost):\n" +
        "• Spinach, lentils, chickpeas, red meat, tofu\n\n" +
        "**Anti-inflammatory foods** (to reduce cramps):\n" +
        "• Turmeric, ginger, fatty fish, berries, leafy greens\n\n" +
        "**Foods to limit during your period**:\n" +
        "• Excess caffeine, salty foods, alcohol, processed sugar\n\n" +
        "**Hydration**: Aim for 8+ glasses of water daily. Herbal teas like chamomile and ginger are great choices."
    ],

    // Exercise
    exercise: [
        "Exercise during your period can actually help! 🏃‍♀️ Here's what works well:\n\n" +
        "• **Light days**: Walking, yoga, swimming\n" +
        "• **Medium days**: Pilates, cycling, light jogging\n" +
        "• **Heavy days**: Gentle stretching, restorative yoga\n\n" +
        "Listen to your body — it's okay to rest if you need to. Regular exercise throughout your cycle can reduce PMS symptoms over time."
    ],

    // Irregular periods
    irregular: [
        "Irregular periods can happen for many reasons 📋:\n\n" +
        "• Stress or lifestyle changes\n" +
        "• Weight fluctuations\n" +
        "• PCOS (Polycystic Ovary Syndrome)\n" +
        "• Thyroid issues\n" +
        "• Starting or stopping birth control\n" +
        "• Excessive exercise\n\n" +
        "If your periods are consistently irregular (cycle length varies by more than 7-9 days), " +
        "it's a good idea to consult with a gynecologist. Tracking your cycles helps provide useful data for your doctor."
    ],

    // Missed period
    missed: [
        "A missed period can be concerning, but there are several possible causes:\n\n" +
        "• Pregnancy (if sexually active, consider taking a test)\n" +
        "• High stress levels\n" +
        "• Significant weight changes\n" +
        "• Excessive exercise\n" +
        "• Hormonal imbalances\n" +
        "• Certain medications\n\n" +
        "🩺 **If you've missed more than 3 consecutive periods, please consult a healthcare provider** for proper evaluation."
    ],

    // Ovulation
    ovulation: [
        "Ovulation typically occurs about 14 days before your next period starts 🥚\n\n" +
        "**Signs of ovulation include**:\n" +
        "• Slight increase in basal body temperature\n" +
        "• Changes in cervical mucus (clearer, stretchy)\n" +
        "• Mild pelvic pain on one side (mittelschmerz)\n" +
        "• Increased energy and mood boost\n\n" +
        "Your fertility window is typically 5 days before and 1 day after ovulation. " +
        "Check your predictions in the app for personalized estimates!"
    ],

    // Medication
    medication: [
        "For period symptom relief, common OTC options include:\n\n" +
        "• **Ibuprofen** (Advil/Motrin): Best for cramps, take with food\n" +
        "• **Naproxen** (Aleve): Longer-lasting pain relief\n" +
        "• **Acetaminophen** (Tylenol): For pain if you can't take NSAIDs\n\n" +
        "⚠️ Always follow dosage instructions on the packaging.\n" +
        "🚨 **Do NOT self-medicate for prolonged periods. Consult a doctor if pain is severe or persistent.**"
    ],

    // Mental health
    mental_health: [
        "Your mental health matters, especially during your cycle 💙\n\n" +
        "Hormonal changes can affect your mood significantly. Here are some coping strategies:\n\n" +
        "• Practice mindfulness or meditation (even 5 minutes helps)\n" +
        "• Journal your thoughts and feelings\n" +
        "• Connect with supportive friends or family\n" +
        "• Get adequate sleep (7-9 hours)\n" +
        "• Spend time outdoors in natural light\n\n" +
        "If you're experiencing persistent sadness, anxiety, or mood changes that significantly " +
        "impact your daily life, please reach out to a mental health professional. You deserve support. 💗"
    ],

    // Fertility
    fertility: [
        "Understanding your fertility window can be helpful for family planning 🌱\n\n" +
        "• **Most fertile days**: 5 days before ovulation and the day of ovulation\n" +
        "• **Ovulation**: Usually occurs mid-cycle (about 14 days before next period)\n" +
        "• **Tracking helps**: Use the app to monitor your cycle patterns\n\n" +
        "For conception or contraception advice, please consult with your healthcare provider " +
        "for personalized guidance based on your health history."
    ],

    // Default / Unknown
    default: [
        "That's a great question! While I may not have a specific answer for that, I encourage you to:\n\n" +
        "• Check our health resources section for more information\n" +
        "• Consult with your healthcare provider for personalized advice\n" +
        "• Keep tracking your symptoms — patterns can reveal a lot!\n\n" +
        "Is there anything else about your period or cycle I can help with? 🌸"
    ],

    // Serious symptoms - escalation
    serious: [
        "🚨 **This sounds like it may need medical attention.**\n\n" +
        "Please consider seeing a healthcare provider as soon as possible if you experience:\n\n" +
        "• Extremely heavy bleeding (soaking through a pad/tampon every hour)\n" +
        "• Severe pain that doesn't respond to OTC medication\n" +
        "• Bleeding between periods or after menopause\n" +
        "• Periods lasting longer than 7 days\n" +
        "• Sudden changes in your cycle pattern\n" +
        "• Fever with period symptoms\n\n" +
        "Your health is important — don't hesitate to seek professional help. 💗"
    ]
};

// Keyword matching patterns
const patterns = [
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'help', 'start'], category: 'greetings' },
    { keywords: ['cramp', 'pain', 'hurt', 'ache', 'painful', 'stomach pain', 'lower abdomen'], category: 'cramps' },
    { keywords: ['pms', 'premenstrual', 'mood swing', 'bloat', 'irritable', 'breast tender'], category: 'pms' },
    { keywords: ['diet', 'food', 'eat', 'nutrition', 'iron', 'vitamin', 'healthy eating', 'meal'], category: 'diet' },
    { keywords: ['exercise', 'workout', 'gym', 'yoga', 'walk', 'run', 'fitness', 'physical'], category: 'exercise' },
    { keywords: ['irregular', 'inconsistent', 'unpredictable', 'not regular', 'cycle varies'], category: 'irregular' },
    { keywords: ['missed period', 'late period', 'no period', 'period late', 'skip', 'absent'], category: 'missed' },
    { keywords: ['ovulat', 'egg', 'fertile day', 'when do i ovulate'], category: 'ovulation' },
    { keywords: ['medicine', 'medication', 'pill', 'ibuprofen', 'painkiller', 'tablet', 'drug'], category: 'medication' },
    { keywords: ['depress', 'anxious', 'anxiety', 'mental', 'stress', 'sad', 'cry', 'emotional', 'mood'], category: 'mental_health' },
    { keywords: ['fertil', 'conceive', 'pregnant', 'pregnancy', 'baby', 'trying to conceive', 'ttc'], category: 'fertility' },
    { keywords: ['heavy bleeding', 'severe pain', 'emergency', 'hospital', 'extreme', 'unbearable', 'clot', 'fever'], category: 'serious' }
];

/**
 * Get Amma's response for a user message
 */
function getAmmaResponse(message, cycleData = null) {
    const lowerMessage = message.toLowerCase().trim();

    // Find matching category
    let matchedCategory = 'default';
    let bestMatchScore = 0;

    for (const pattern of patterns) {
        let score = 0;
        for (const keyword of pattern.keywords) {
            if (lowerMessage.includes(keyword)) {
                score += keyword.length; // Longer matches score higher
            }
        }
        if (score > bestMatchScore) {
            bestMatchScore = score;
            matchedCategory = pattern.category;
        }
    }

    // Get response from category
    const categoryResponses = responses[matchedCategory];
    const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    // Add contextual cycle info if available
    let contextualInfo = '';
    if (cycleData && matchedCategory !== 'greetings' && matchedCategory !== 'default') {
        if (cycleData.daysUntilNextPeriod !== undefined) {
            if (cycleData.daysUntilNextPeriod > 0) {
                contextualInfo = `\n\n📅 Based on your data, your next period is predicted in about ${cycleData.daysUntilNextPeriod} days.`;
            } else if (cycleData.daysUntilNextPeriod <= 0) {
                contextualInfo = `\n\n📅 Based on your data, your period may be due now or is slightly late.`;
            }
        }
    }

    return response + contextualInfo + DISCLAIMER;
}

module.exports = { getAmmaResponse };
