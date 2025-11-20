const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId, email, username) => {
  return jwt.sign(
    { 
      userId, 
      email,
      username 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { generateToken };

