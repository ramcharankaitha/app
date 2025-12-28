-- Migration: Make customer email field nullable
-- This removes the NOT NULL constraint from the email column in customers table

-- First, update any existing NULL emails to a placeholder (if needed)
-- Then alter the column to allow NULL values

-- Remove UNIQUE constraint temporarily
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Make email nullable
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Note: We're not re-adding the UNIQUE constraint since email can now be NULL
-- Multiple NULL values are allowed in PostgreSQL

