-- Add 'deleter' to the role enum (must be in its own transaction before being used)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deleter';
