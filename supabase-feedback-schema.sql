-- VouchFor Feedback & Feature Requests Schema
-- Run this SQL in your Supabase SQL Editor

-- Create feedback/feature requests table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT CHECK (user_role IN ('vendor', 'partner', NULL)),
  type TEXT NOT NULL CHECK (type IN ('feature', 'bug', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create feedback votes table to track user votes
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(feedback_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes ON feedback(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
-- Anyone can view feedback
CREATE POLICY "Anyone can view feedback"
  ON feedback FOR SELECT
  USING (true);

-- Authenticated users can insert feedback
CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for feedback_votes
-- Anyone can view votes
CREATE POLICY "Anyone can view feedback votes"
  ON feedback_votes FOR SELECT
  USING (true);

-- Authenticated users can insert votes
CREATE POLICY "Authenticated users can insert votes"
  ON feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON feedback_votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update vote counts when a vote is added/updated/deleted
CREATE OR REPLACE FUNCTION update_feedback_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE feedback SET upvotes = upvotes + 1 WHERE id = NEW.feedback_id;
    ELSE
      UPDATE feedback SET downvotes = downvotes + 1 WHERE id = NEW.feedback_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'upvote' THEN
      UPDATE feedback SET upvotes = upvotes - 1 WHERE id = OLD.feedback_id;
    ELSE
      UPDATE feedback SET downvotes = downvotes - 1 WHERE id = OLD.feedback_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'upvote' THEN
      UPDATE feedback SET upvotes = upvotes + 1 WHERE id = NEW.feedback_id;
    ELSE
      UPDATE feedback SET downvotes = downvotes + 1 WHERE id = NEW.feedback_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE feedback SET upvotes = upvotes - 1 WHERE id = OLD.feedback_id;
    ELSE
      UPDATE feedback SET downvotes = downvotes - 1 WHERE id = OLD.feedback_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS trigger_update_feedback_vote_counts ON feedback_votes;
CREATE TRIGGER trigger_update_feedback_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_counts();

