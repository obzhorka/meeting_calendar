-- Script do szybkiego setupu bazy danych
-- Uruchom: psql -U postgres -f scripts/setup-database.sql

-- Tworzenie bazy danych
DROP DATABASE IF EXISTS meeting_scheduler;
CREATE DATABASE meeting_scheduler;

-- Połącz z nową bazą
\c meeting_scheduler

-- Teraz uruchom główny schemat
\i server/database/schema.sql

-- Opcjonalnie: dodaj użytkowników testowych
-- Hasło dla wszystkich: test123 (zahashowane przez bcrypt)
INSERT INTO users (username, email, password_hash, full_name) VALUES
('jan_kowalski', 'jan@example.com', '$2a$10$YourHashedPasswordHere', 'Jan Kowalski'),
('anna_nowak', 'anna@example.com', '$2a$10$YourHashedPasswordHere', 'Anna Nowak'),
('piotr_wisniewski', 'piotr@example.com', '$2a$10$YourHashedPasswordHere', 'Piotr Wiśniewski');

-- Wyświetl utworzone tabele
\dt

-- Wyświetl użytkowników
SELECT id, username, email, full_name FROM users;

