create table call_sessions (
  id uuid default gen_random_uuid() primary key,
  trainee_id uuid references users(id) on delete cascade not null,
  transcript jsonb,
  recording_url text,
  duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table call_sessions enable row level security;

create policy "Users can view their own call sessions"
  on call_sessions for select
  using (auth.uid() = trainee_id); 