-- Supabase Database Schema for EasySEO

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_errors INTEGER DEFAULT 0,
  total_warnings INTEGER DEFAULT 0,
  good_points INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 1,
  full_report_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  current_rank INTEGER,
  previous_rank INTEGER,
  best_rank INTEGER,
  search_volume TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('content', 'technical', 'performance')),
  title TEXT NOT NULL,
  description TEXT,
  impact_score INTEGER,
  status TEXT CHECK (status IN ('open', 'implemented')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $ 
BEGIN
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own profile') THEN
        CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Projects
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own projects') THEN
        CREATE POLICY "Users can only access their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Analyses
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access analyses of their projects') THEN
        CREATE POLICY "Users can only access analyses of their projects" ON analyses FOR ALL USING (
            project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
        );
    END IF;

    -- Keywords
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own keywords') THEN
        CREATE POLICY "Users can only access their own keywords" ON keywords FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own tasks') THEN
        CREATE POLICY "Users can only access their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Suggestions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access suggestions of their analyses') THEN
        CREATE POLICY "Users can only access suggestions of their analyses" ON suggestions FOR ALL USING (
            analysis_id IN (
                SELECT id FROM analyses WHERE project_id IN (
                    SELECT id FROM projects WHERE user_id = auth.uid()
                )
            )
        );
    END IF;
END $;

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
