create type user_role as enum ('admin', 'trainer', 'trainee');

create table users (
  id uuid references auth.users on delete cascade,
  email text unique not null,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Set up RLS (Row Level Security)
alter table users enable row level security;

create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id); 