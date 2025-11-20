const bcrypt = require('bcryptjs');
const pool = require('../database/db');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

// Rejestracja użytkownika
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, full_name } = req.body;

  try {
    // Sprawdź czy użytkownik już istnieje
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Użytkownik o podanym adresie email lub nazwie użytkownika już istnieje' 
      });
    }

    // Hashowanie hasła
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Dodanie użytkownika do bazy
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, created_at',
      [username, email, passwordHash, full_name]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.username);

    res.status(201).json({
      message: 'Użytkownik został zarejestrowany',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
};

// Logowanie użytkownika
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Znajdź użytkownika
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const user = result.rows[0];

    // Sprawdź hasło
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const token = generateToken(user.id, user.email, user.username);

    res.json({
      message: 'Zalogowano pomyślnie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
};

// Pobranie profilu użytkownika
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, created_at, updated_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { register, login, getProfile };

