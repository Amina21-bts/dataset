-- ========================================================
-- Supabase Schema for Lung Cancer Diagnostics
-- Project: kdcrjunhhzpguqfgoixh
-- ========================================================

-- 1. Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Patient Diagnoses / Predictions Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT,
    image_filename TEXT NOT NULL,
    predicted_class TEXT NOT NULL CHECK (predicted_class IN ('NORMAL', 'Cancer')),
    confidence NUMERIC(5, 2) NOT NULL,
    raw_score NUMERIC(7, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Users can only view their own predictions
CREATE POLICY "Users can view their own predictions"
    ON public.predictions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Policy: Authenticated users can insert predictions
CREATE POLICY "Users can insert their own predictions"
    ON public.predictions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

