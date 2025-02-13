create table call_feedback (
  id uuid default gen_random_uuid() primary key,
  call_session_id uuid references call_sessions(id) on delete cascade not null,
  scores jsonb not null,
  comments text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table call_feedback enable row level security;

create policy "Users can view feedback for their calls"
  on call_feedback for select
  using (
    exists (
      select 1 from call_sessions
      where call_sessions.id = call_feedback.call_session_id
      and call_sessions.trainee_id = auth.uid()
    )
  );

create policy "Users can create feedback for their calls"
  on call_feedback for insert
  with check (
    exists (
      select 1 from call_sessions
      where call_sessions.id = call_feedback.call_session_id
      and call_sessions.trainee_id = auth.uid()
    )
  ); 