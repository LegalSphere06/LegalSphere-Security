// Recursively sanitize object properties to prevent NoSQL injection
const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;

    for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'string') {
            obj[key] = escapeHtml(obj[key]);
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
    return obj;
};

// Escape HTML special characters to prevent XSS
const escapeHtml = (str) => {
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
};

// Express 5.x compatible sanitization middleware
const sanitizeInput = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    // Mutate properties in-place (req.query is read-only in Express 5)
    if (req.query && typeof req.query === 'object') {
        sanitizeObject(req.query);
    }
    next();
};

export default sanitizeInput;
