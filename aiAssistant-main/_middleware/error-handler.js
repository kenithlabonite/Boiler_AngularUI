module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    // Special handling for chatbot endpoints - don't send 401
    if (req.path.includes('/chatbot')) {
        console.error('Chatbot error:', err);
        return res.status(err.status || 500).json({
            success: false,
            error: err.message || 'An error occurred with the chatbot',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // Regular error handling for other endpoints
    switch (true) {
        case typeof err === 'string':
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });
        case err.message && err.message.toLowerCase().includes('deactivated'):
            return res.status(403).json({ message: 'deactivated' });
        case err.name === 'UnauthorizedError':
            return res.status(401).json({ message: 'Unauthorized error-handler' });
        default:
            return res.status(500).json({ message: err.message });
    }
}