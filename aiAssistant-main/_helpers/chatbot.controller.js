// _helpers/chatbot.controller.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = 
    'You are a helpful and knowledgeable instructor. ' +
    'Provide clear, concise, and structured answers. Use markdown formatting extensively.';

async function sendMessage(req, res) {
    try {
        const { message, conversationHistory } = req.body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required and must be a string' 
            });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env file'
            });
        }

        // Use model compatible with SDK version 0.24.1
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash'
        });

        // Build conversation history - Filter out leading 'model' messages
        let history = [];
        if (conversationHistory && Array.isArray(conversationHistory)) {
            history = conversationHistory.slice(-10); // Last 10 messages for context
            
            // CRITICAL: Remove any leading 'model' messages
            // Gemini API requires chat to START with a 'user' message
            while (history.length > 0 && history[0].role === 'model') {
                history.shift();
            }
        }

        // Add current user message
        history.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Start chat with history
        const chat = model.startChat({
            history: history.slice(0, -1), // All except the current message
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        // Send the current message with retry
        let result;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                result = await chat.sendMessage(message);
                break; // Success, exit loop
            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw err; // Max attempts reached, throw error
                }
                console.log(`Attempt ${attempts} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
        }
        
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            response: text,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('=== GEMINI API ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error type:', error.constructor.name);
        console.error('API Key exists:', !!process.env.GEMINI_API_KEY);
        console.error('========================');
        
        // Handle specific Gemini API errors
        if (error.message && error.message.includes('API key not valid')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key configuration'
            });
        }

        if (error.message && error.message.includes('quota')) {
            return res.status(429).json({
                success: false,
                error: 'API quota exceeded. Please try again later.'
            });
        }

        if (error.message && error.message.includes('overloaded')) {
            return res.status(503).json({
                success: false,
                error: 'AI service is temporarily overloaded. Please try again in a moment.'
            });
        }

        if (error.message && error.message.includes('role')) {
            return res.status(400).json({
                success: false,
                error: 'Chat history format error. Please refresh and try again.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to get response from AI',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

module.exports = {
    sendMessage
};