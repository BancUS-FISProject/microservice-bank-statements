const jwt = require('jsonwebtoken');

/**
 * Middleware para extraer y decodificar el token JWT
 * Extrae name, email, iban del token y los adjunta a req.user
 */
function extractUserFromToken(req, res, next) {
    try {
        // Buscar el token en el header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            // No hay token - es válido para endpoints públicos
            req.user = null;
            return next();
        }

        // Formato esperado: "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.warn('[auth] Invalid Authorization header format');
            req.user = null;
            return next();
        }

        const token = parts[1];

        // Decodificar sin verificar (porque el API Gateway ya verificó)
        // Si necesitas verificar, usa jwt.verify(token, secret)
        const decoded = jwt.decode(token);

        if (!decoded) {
            console.warn('[auth] Failed to decode token');
            req.user = null;
            return next();
        }

        // Extraer datos del usuario
        req.user = {
            id: decoded.id || decoded.userId || decoded.sub,
            name: decoded.name || '',
            email: decoded.email || '',
            iban: decoded.iban || '',
            phoneNumber: decoded.phoneNumber || '',
            subscription: decoded.subscription || 'basico'
        };

        console.log('[auth] User extracted from token:', {
            id: req.user.id,
            email: req.user.email,
            iban: req.user.iban
        });

        next();
    } catch (error) {
        console.error('[auth] Error extracting user from token:', error.message);
        req.user = null;
        next();
    }
}

/**
 * Middleware que requiere autenticación obligatoria
 * Devuelve 401 si no hay token válido
 */
function requireAuth(req, res, next) {
    if (!req.user || !req.user.iban) {
        return res.status(401).json({
            error: 'unauthorized',
            message: 'Se requiere autenticación válida con IBAN'
        });
    }
    next();
}

module.exports = { extractUserFromToken, requireAuth };
