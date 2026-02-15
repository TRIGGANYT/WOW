const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Kein Authentifizierungstoken gefunden' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: 'Ungültiges Token Format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId: ..., email: ... }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Ungültiges oder abgelaufenes Token' });
  }
};

module.exports = authMiddleware;
