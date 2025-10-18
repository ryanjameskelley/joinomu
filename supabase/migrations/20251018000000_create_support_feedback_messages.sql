-- Create support_feedback_messages table
CREATE TABLE IF NOT EXISTS support_feedback_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('support', 'feedback')),
    message TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    sent_to TEXT NOT NULL DEFAULT 'ryan@joinomu.com',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_feedback_messages_updated_at 
    BEFORE UPDATE ON support_feedback_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE support_feedback_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own support/feedback messages" ON support_feedback_messages
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own messages
CREATE POLICY "Users can view their own support/feedback messages" ON support_feedback_messages
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Add index for performance
CREATE INDEX idx_support_feedback_messages_user_email ON support_feedback_messages(user_email);
CREATE INDEX idx_support_feedback_messages_created_at ON support_feedback_messages(created_at);