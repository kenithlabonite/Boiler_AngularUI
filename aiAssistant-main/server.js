require('rootpath')();
// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('_middleware/error-handler');
const chatbotController = require('./_helpers/chatbot.controller');

// ============================================
// MIDDLEWARE SETUP (MUST COME BEFORE ROUTES)
// ============================================

// Configure CORS - allow requests from Angular frontend
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// Parse request bodies (CRITICAL - must be before routes)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'products')));

// ============================================
// API ROUTES (MUST COME AFTER MIDDLEWARE)
// ============================================

// Chatbot route (NO authentication required)
app.post('/api/chatbot/message', chatbotController.sendMessage);

// Other API routes
app.use('/api/accounts', require('./accounts/account.controller'));
app.use('/api-docs', require('./_helpers/swagger'));
app.use('/api/tasks', require('./tasks/tasks.controller'));
app.use('/api/task-ai-tags', require('./task_ai_tags/task_ai_tags.controller')); // ✅ Add this

// ============================================
// ERROR HANDLER (MUST BE LAST)
// ============================================
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4300;
app.listen(port, () => {
    console.log('='.repeat(50));
    console.log('Server listening on port ' + port);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ NOT FOUND');
    console.log('='.repeat(50));
});