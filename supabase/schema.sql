-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with auth user id
CREATE TABLE users (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create groups table
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    split_amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE
);

-- Create expense_participants table
CREATE TABLE expense_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, participant)
);

-- Create expense_payers table
CREATE TABLE expense_payers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    payer UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, payer)
);

-- Create settlements table
CREATE TABLE settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    from_friend UUID NOT NULL REFERENCES users(id),
    to_friend UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Add policy for inserting user profile
CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policies for groups table
CREATE POLICY "Users can view groups they are members of"
    ON groups FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    ));

CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
    ON groups FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
    ON groups FOR DELETE
    USING (auth.uid() = created_by);

-- Policies for group_members table
CREATE POLICY "Users can view members of their groups"
    ON group_members FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM group_members gm 
            WHERE gm.group_id = group_members.group_id
        )
    );

CREATE POLICY "Group creators can manage members"
    ON group_members FOR ALL
    USING (EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = group_members.group_id
        AND groups.created_by = auth.uid()
    ));

-- Policies for expenses table
CREATE POLICY "Users can view expenses in their groups"
    ON expenses FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for expense_participants and expense_payers
CREATE POLICY "Users can view participants and payers of accessible expenses"
    ON expense_participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_participants.expense_id
        AND (
            expenses.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = expenses.group_id
                AND group_members.user_id = auth.uid()
            )
        )
    ));

CREATE POLICY "Expense creators can manage participants"
    ON expense_participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_participants.expense_id
        AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can view payers of accessible expenses"
    ON expense_payers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_payers.expense_id
        AND (
            expenses.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = expenses.group_id
                AND group_members.user_id = auth.uid()
            )
        )
    ));

CREATE POLICY "Expense creators can manage payers"
    ON expense_payers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM expenses
        WHERE expenses.id = expense_payers.expense_id
        AND expenses.user_id = auth.uid()
    ));

-- Policies for settlements table
CREATE POLICY "Users can view settlements they're involved in"
    ON settlements FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() = from_friend OR
        auth.uid() = to_friend OR
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = settlements.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create settlements"
    ON settlements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update settlements they created"
    ON settlements FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete settlements they created"
    ON settlements FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
