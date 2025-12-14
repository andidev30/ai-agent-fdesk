-- AI Front Desk Agent - Database Schema
-- PostgreSQL (compatible with Cloud SQL / AlloyDB)

-- =============================================
-- CATEGORIES: Service categories for queue routing
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,          -- e.g., 'A', 'B', 'C'
    name VARCHAR(100) NOT NULL,                -- e.g., 'General Inquiry'
    avg_handling_time_min INTEGER DEFAULT 5,   -- Average time per ticket
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SESSIONS: Conversation sessions
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'id',         -- 'id' or 'en'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- QUEUE_TICKETS: Customer queue entries
-- =============================================
CREATE TABLE IF NOT EXISTS queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_no VARCHAR(20) NOT NULL UNIQUE,      -- e.g., 'A-014'
    category_id INTEGER REFERENCES categories(id),
    session_id UUID REFERENCES sessions(id),
    
    -- Customer info (optional, consent-based)
    customer_name VARCHAR(255),
    phone VARCHAR(50),
    
    -- Priority: 0=urgent/VIP, 1=normal, 2=scheduled
    priority INTEGER DEFAULT 1,
    
    -- Status: waiting, called, serving, completed, cancelled
    status VARCHAR(20) DEFAULT 'waiting',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    served_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Counter ID when being served
    counter_id VARCHAR(50),
    
    -- Calculated ETA at time of creation
    eta_minutes INTEGER
);

-- =============================================
-- HANDOFF_NOTES: AI-generated summaries for staff
-- =============================================
CREATE TABLE IF NOT EXISTS handoff_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES queue_tickets(id),
    session_id UUID REFERENCES sessions(id),
    
    -- AI-generated summary
    summary TEXT NOT NULL,
    issue_category VARCHAR(100),
    sentiment VARCHAR(20),                     -- positive, neutral, negative
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DAILY_SEQUENCE: Track daily queue number sequences
-- =============================================
CREATE TABLE IF NOT EXISTS daily_sequences (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(10) NOT NULL,
    sequence_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_number INTEGER DEFAULT 1,
    UNIQUE(category_code, sequence_date)
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_queue_tickets_status ON queue_tickets(status);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_created_at ON queue_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_category ON queue_tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- =============================================
-- SEED DATA: Default categories
-- =============================================
INSERT INTO categories (code, name, avg_handling_time_min) VALUES
    ('A', 'General Inquiry', 5),
    ('B', 'Account Services', 10),
    ('C', 'Technical Support', 15),
    ('D', 'Complaints', 20)
ON CONFLICT (code) DO NOTHING;
