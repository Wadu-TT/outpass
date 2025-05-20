
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Warden access only
const wardenAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role === 'warden' || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Warden permission required.' });
    }
  });
};

// Student access only
const studentAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.type === 'student') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Student permission required.' });
    }
  });
};

module.exports = { auth, wardenAuth, studentAuth };