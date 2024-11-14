-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create friends table
CREATE TABLE friends (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    split_amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expense_participants table
CREATE TABLE expense_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, participant)
);

-- Create expense_payers table
CREATE TABLE expense_payers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    payer VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, payer)
);

-- Create settlements table
CREATE TABLE settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    from_friend VARCHAR(255) NOT NULL,
    to_friend VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create policies for friends table
CREATE POLICY "Users can view their own friends"
    ON friends FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own friends"
    ON friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friends"
    ON friends FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friends"
    ON friends FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for expenses table
CREATE POLICY "Users can view their own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for expense_participants table
CREATE POLICY "Users can view their expense participants"
    ON expense_participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_participants.expense_id
        AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their expense participants"
    ON expense_participants FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_participants.expense_id
        AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their expense participants"
    ON expense_participants FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_participants.expense_id
        AND expenses.user_id = auth.uid()
    ));

-- Create policies for expense_payers table
CREATE POLICY "Users can view their expense payers"
    ON expense_payers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_payers.expense_id
        AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their expense payers"
    ON expense_payers FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_payers.expense_id
        AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their expense payers"
    ON expense_payers FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_payers.expense_id
        AND expenses.user_id = auth.uid()
    ));

-- Create policies for settlements table
CREATE POLICY "Users can view their settlements"
    ON settlements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their settlements"
    ON settlements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settlements"
    ON settlements FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their settlements"
    ON settlements FOR DELETE
    USING (auth.uid() = user_id);
