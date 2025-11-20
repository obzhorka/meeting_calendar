-- Script do zresetowania bazy danych (UWAGA: usuwa wszystkie dane!)
-- Uruchom: psql -U postgres -d meeting_scheduler -f scripts/reset-database.sql

-- Usuń wszystkie dane z tabel (w odpowiedniej kolejności)
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE location_votes CASCADE;
TRUNCATE TABLE location_proposals CASCADE;
TRUNCATE TABLE time_slot_votes CASCADE;
TRUNCATE TABLE proposed_time_slots CASCADE;
TRUNCATE TABLE event_participants CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE user_availability CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE friendships CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE users CASCADE;

-- Zresetuj sekwencje ID
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE friendships_id_seq RESTART WITH 1;
ALTER SEQUENCE groups_id_seq RESTART WITH 1;
ALTER SEQUENCE group_members_id_seq RESTART WITH 1;
ALTER SEQUENCE user_availability_id_seq RESTART WITH 1;
ALTER SEQUENCE events_id_seq RESTART WITH 1;
ALTER SEQUENCE event_participants_id_seq RESTART WITH 1;
ALTER SEQUENCE proposed_time_slots_id_seq RESTART WITH 1;
ALTER SEQUENCE time_slot_votes_id_seq RESTART WITH 1;
ALTER SEQUENCE location_proposals_id_seq RESTART WITH 1;
ALTER SEQUENCE location_votes_id_seq RESTART WITH 1;
ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

-- Pokaż wynik
SELECT 'Baza danych została zresetowana!' as status;

