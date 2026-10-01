-- OpenReel schema. Run in Supabase SQL editor.
create extension if not exists pg_trgm;
create table profiles(id uuid primary key references auth.users on delete cascade,
  display_name text, avatar_url text, role text not null default 'user' check(role in('user','admin')), created_at timestamptz default now());
create table genres(id serial primary key, name text unique not null, slug text unique not null);
create table categories(id serial primary key, name text unique not null, slug text unique not null); -- e.g. Public Domain, Indie, Classics
create table people(id serial primary key, name text not null, kind text check(kind in('actor','director','both')) default 'actor');
create table movies(id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, description text,
  year int, language text, runtime_min int, rating numeric(3,1) default 0, poster_url text, backdrop_url text, trailer_url text,
  video_url text,                       -- ONLY authorized sources (self-hosted / licensed / public domain)
  license_type text not null check(license_type in('public_domain','licensed','creator_permission')),
  license_proof_url text, license_notes text,  -- admin must record proof of rights
  featured boolean default false, published boolean default false, views int default 0,
  category_id int references categories, created_at timestamptz default now(), updated_at timestamptz default now());
create table movie_genres(movie_id uuid references movies on delete cascade, genre_id int references genres on delete cascade, primary key(movie_id,genre_id));
create table movie_cast(movie_id uuid references movies on delete cascade, person_id int references people on delete cascade, character_name text, primary key(movie_id,person_id));
create table movie_directors(movie_id uuid references movies on delete cascade, person_id int references people on delete cascade, primary key(movie_id,person_id));
create table watchlists(user_id uuid references profiles on delete cascade, movie_id uuid references movies on delete cascade, added_at timestamptz default now(), primary key(user_id,movie_id));
create table watch_history(user_id uuid references profiles on delete cascade, movie_id uuid references movies on delete cascade, progress_sec int default 0, watched_at timestamptz default now(), primary key(user_id,movie_id));
create table reviews(id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, movie_id uuid references movies on delete cascade, stars int check(stars between 1 and 5), body text, created_at timestamptz default now(), unique(user_id,movie_id));
create table advertisements(id serial primary key, placement text check(placement in('home_banner','sidebar','movie_below_player','footer')), title text, image_url text, link_url text, active boolean default true, impressions int default 0, clicks int default 0);
create index on movies(year); create index on movies(language); create index on movies using gin(title gin_trgm_ops);

create or replace function is_admin() returns boolean language sql security definer as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

-- Search across title, actor, director, genre, year, language
create or replace function search_movies(q text) returns setof movies language sql stable as $$
 select distinct m.* from movies m
 left join movie_cast mc on mc.movie_id=m.id left join movie_directors md on md.movie_id=m.id
 left join people p on p.id in (mc.person_id, md.person_id)
 left join movie_genres mg on mg.movie_id=m.id left join genres g on g.id=mg.genre_id
 where m.published and (m.title ilike '%'||q||'%' or p.name ilike '%'||q||'%' or g.name ilike '%'||q||'%'
   or m.language ilike '%'||q||'%' or m.year::text=q) limit 60 $$;

alter table profiles enable row level security; alter table movies enable row level security; alter table genres enable row level security;
alter table categories enable row level security; alter table people enable row level security; alter table movie_genres enable row level security;
alter table movie_cast enable row level security; alter table movie_directors enable row level security; alter table watchlists enable row level security;
alter table watch_history enable row level security; alter table reviews enable row level security; alter table advertisements enable row level security;
create policy "public read movies" on movies for select using(published or is_admin());
create policy "public read" on genres for select using(true); create policy "public read" on categories for select using(true);
create policy "public read" on people for select using(true); create policy "public read" on movie_genres for select using(true);
create policy "public read" on movie_cast for select using(true); create policy "public read" on movie_directors for select using(true);
create policy "public read" on reviews for select using(true); create policy "public read ads" on advertisements for select using(active or is_admin());
create policy "own profile" on profiles for select using(id=auth.uid() or is_admin());
create policy "edit own profile" on profiles for update using(id=auth.uid());
create policy "own watchlist" on watchlists for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own history" on watch_history for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own reviews" on reviews for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "admin all movies" on movies for all using(is_admin()) with check(is_admin());
create policy "admin all genres" on genres for all using(is_admin()) with check(is_admin());
create policy "admin all ads" on advertisements for all using(is_admin()) with check(is_admin());
create policy "admin people" on people for all using(is_admin()) with check(is_admin());
-- Storage: create public bucket "posters" and private/public bucket "videos" in the Supabase dashboard.
-- Make yourself admin:  update profiles set role='admin' where id='<your-user-uuid>';
