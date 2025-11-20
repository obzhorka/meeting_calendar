-- Migration: Add confirmed_start_time and confirmed_end_time columns to events table
-- Run this if you have an existing database

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS confirmed_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_end_time TIMESTAMP;

-- Add check constraint
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_confirmed_time_check;

ALTER TABLE events 
ADD CONSTRAINT events_confirmed_time_check 
CHECK (confirmed_end_time IS NULL OR confirmed_start_time IS NULL OR confirmed_end_time > confirmed_start_time);

