-- Create user_sessions table for tracking online users
CREATE TABLE IF NOT EXISTS user_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'professor', 'admin')),
  user_email TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on last_seen for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen ON user_sessions(last_seen DESC);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to insert/update their own session
CREATE POLICY "users_can_insert_update_own_session" ON user_sessions
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow admins to view all sessions
CREATE POLICY "admin_can_view_all_sessions" ON user_sessions
FOR SELECT USING (true);
