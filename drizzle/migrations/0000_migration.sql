
-- ENUMS
create type public.app_role as enum ('admin','customer','worker');
create type public.verification_status as enum ('pending','verified','rejected');
create type public.availability_status as enum ('available','busy','offline');
create type public.pricing_unit as enum ('per_hour','per_visit','per_job','per_day');
create type public.booking_type as enum ('immediate','scheduled');
create type public.booking_status as enum ('pending','accepted','rejected','in_progress','completed','cancelled');
create type public.offer_status as enum ('pending','accepted','rejected','countered','withdrawn');
create type public.complaint_status as enum ('open','in_review','resolved','dismissed');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "Own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Admin profile update" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- prevent non-admins from changing suspension
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    new.is_suspended := old.is_suspended;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_guard_profile before update on public.profiles
for each row execute function public.guard_profile_update();

-- signup trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  acct text := coalesce(new.raw_user_meta_data->>'account_type','customer');
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  if acct = 'worker' then
    insert into public.user_roles (user_id, role) values (new.id, 'worker') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- CATEGORIES
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text not null default 'Wrench',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.service_categories to anon, authenticated;
grant insert, update, delete on public.service_categories to authenticated;
grant all on public.service_categories to service_role;
alter table public.service_categories enable row level security;
create policy "Categories public read" on public.service_categories for select to anon, authenticated using (true);
create policy "Admin manage categories" on public.service_categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- WORKER PROFILES
create table public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  display_name text not null,
  avatar_url text,
  bio text,
  experience_years int not null default 0 check (experience_years >= 0 and experience_years <= 70),
  locality text not null default '',
  city text not null default 'Mumbai',
  latitude double precision,
  longitude double precision,
  service_radius_km int not null default 5 check (service_radius_km between 1 and 100),
  verification_status public.verification_status not null default 'pending',
  verification_note text,
  verification_submitted_at timestamptz,
  availability_status public.availability_status not null default 'available',
  working_hours text,
  languages text[] not null default '{}',
  rating_avg numeric(3,2) not null default 0,
  review_count int not null default 0,
  completed_jobs int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.worker_profiles (verification_status);
create index on public.worker_profiles (availability_status);
grant select on public.worker_profiles to anon, authenticated;
grant insert, update on public.worker_profiles to authenticated;
grant all on public.worker_profiles to service_role;
alter table public.worker_profiles enable row level security;
create policy "Workers public read" on public.worker_profiles for select to anon, authenticated using (true);
create policy "Worker inserts own" on public.worker_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(auth.uid(),'worker'));
create policy "Worker updates own" on public.worker_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admin updates workers" on public.worker_profiles for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_worker_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
      new.verification_note := null;
      new.rating_avg := 0; new.review_count := 0; new.completed_jobs := 0;
      new.is_demo := false;
    else
      new.verification_status := old.verification_status;
      new.verification_note := old.verification_note;
      new.rating_avg := old.rating_avg; new.review_count := old.review_count;
      new.completed_jobs := old.completed_jobs; new.is_demo := old.is_demo;
      new.user_id := old.user_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_guard_worker before insert or update on public.worker_profiles
for each row execute function public.guard_worker_profile();

-- WORKER SERVICES
create table public.worker_services (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  category_id uuid not null references public.service_categories(id),
  description text,
  base_price numeric(10,2) not null check (base_price > 0),
  pricing_unit public.pricing_unit not null default 'per_visit',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (worker_id, category_id)
);
create index on public.worker_services (category_id);
grant select on public.worker_services to anon, authenticated;
grant insert, update, delete on public.worker_services to authenticated;
grant all on public.worker_services to service_role;
alter table public.worker_services enable row level security;
create policy "Services public read" on public.worker_services for select to anon, authenticated using (true);
create policy "Worker manages own services" on public.worker_services for all to authenticated
  using (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));

-- BOOKINGS
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default ('LS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_id uuid not null,
  worker_id uuid not null references public.worker_profiles(id),
  service_id uuid not null references public.worker_services(id),
  job_description text not null check (char_length(job_description) between 5 and 2000),
  service_address text not null check (char_length(service_address) between 3 and 500),
  locality text not null,
  scheduled_at timestamptz,
  booking_type public.booking_type not null default 'immediate',
  customer_budget numeric(10,2) check (customer_budget is null or customer_budget > 0),
  agreed_price numeric(10,2),
  status public.booking_status not null default 'pending',
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.bookings (customer_id);
create index on public.bookings (worker_id);
create index on public.bookings (status);
grant select, insert on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create or replace function public.is_booking_worker(_booking_worker uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.worker_profiles where id = _booking_worker and user_id = auth.uid())
$$;

create policy "Participants read bookings" on public.bookings for select to authenticated
  using (customer_id = auth.uid() or public.is_booking_worker(worker_id) or public.has_role(auth.uid(),'admin'));
create policy "Customers create bookings" on public.bookings for insert to authenticated
  with check (customer_id = auth.uid());

create or replace function public.validate_booking_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare w record; s record;
begin
  select * into w from public.worker_profiles where id = new.worker_id;
  if w is null then raise exception 'Worker not found'; end if;
  if w.is_demo or w.user_id is null then raise exception 'This is a demonstration profile and cannot be booked'; end if;
  if w.user_id = new.customer_id then raise exception 'You cannot book yourself'; end if;
  if exists (select 1 from public.profiles where id = new.customer_id and is_suspended) then raise exception 'Your account is suspended'; end if;
  select * into s from public.worker_services where id = new.service_id;
  if s is null or s.worker_id <> new.worker_id or not s.is_active then raise exception 'Invalid service for this worker'; end if;
  if new.booking_type = 'scheduled' then
    if new.scheduled_at is null then raise exception 'Scheduled bookings need a date and time'; end if;
    if new.scheduled_at < now() then raise exception 'Scheduled time must be in the future'; end if;
  else
    new.scheduled_at := null;
  end if;
  new.status := 'pending';
  new.agreed_price := null;
  new.cancel_reason := null;
  return new;
end $$;
create trigger trg_validate_booking before insert on public.bookings
for each row execute function public.validate_booking_insert();

-- PRICE OFFERS
create table public.price_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  offered_by uuid not null,
  amount numeric(10,2) not null check (amount > 0),
  message text check (message is null or char_length(message) <= 500),
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index on public.price_offers (booking_id);
grant select on public.price_offers to authenticated;
grant all on public.price_offers to service_role;
alter table public.price_offers enable row level security;
create policy "Participants read offers" on public.price_offers for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id
    and (b.customer_id = auth.uid() or public.is_booking_worker(b.worker_id) or public.has_role(auth.uid(),'admin'))));

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  reviewer_name text not null default '',
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  worker_response text check (worker_response is null or char_length(worker_response) <= 1000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.reviews (worker_id);
grant select on public.reviews to anon, authenticated;
grant insert, update on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public visible reviews" on public.reviews for select to anon, authenticated
  using (not is_hidden or customer_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Customer reviews completed booking" on public.reviews for insert to authenticated
  with check (customer_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()
      and b.status = 'completed' and b.worker_id = reviews.worker_id));
create policy "Worker responds" on public.reviews for update to authenticated
  using (public.is_booking_worker(worker_id));
create policy "Admin moderates reviews" on public.reviews for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.worker_response := null; new.is_hidden := false;
    select coalesce(nullif(full_name,''),'Customer') into new.reviewer_name from public.profiles where id = new.customer_id;
  else
    if not public.has_role(auth.uid(),'admin') then
      new.rating := old.rating; new.comment := old.comment; new.is_hidden := old.is_hidden;
    end if;
    new.booking_id := old.booking_id; new.customer_id := old.customer_id; new.worker_id := old.worker_id;
    new.reviewer_name := old.reviewer_name;
  end if;
  return new;
end $$;
create trigger trg_guard_review before insert or update on public.reviews
for each row execute function public.guard_review();

create or replace function public.refresh_worker_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.worker_profiles w set
    rating_avg = coalesce((select round(avg(rating)::numeric,2) from public.reviews r where r.worker_id = w.id and not r.is_hidden),0),
    review_count = (select count(*) from public.reviews r where r.worker_id = w.id and not r.is_hidden)
  where w.id = new.worker_id;
  return null;
end $$;
create trigger trg_refresh_rating after insert or update on public.reviews
for each row execute function public.refresh_worker_rating();

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null default 'general',
  related_booking_id uuid references public.bookings(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, is_read);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create or replace function public.notify(_user uuid, _title text, _msg text, _type text, _booking uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, message, type, related_booking_id)
  select _user, _title, _msg, _type, _booking where _user is not null;
$$;
revoke execute on function public.notify(uuid,text,text,text,uuid) from public, anon, authenticated;

create or replace function public.on_booking_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare wuser uuid;
begin
  select user_id into wuser from public.worker_profiles where id = new.worker_id;
  perform public.notify(wuser, 'New booking request', 'You have a new ' || new.booking_type || ' booking request (' || new.booking_code || ').', 'booking_request', new.id);
  return null;
end $$;
create trigger trg_booking_created after insert on public.bookings
for each row execute function public.on_booking_created();

-- COMPLAINTS
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  reporter_id uuid not null,
  reported_user_id uuid,
  subject text not null default 'Problem report',
  description text not null check (char_length(description) between 10 and 2000),
  status public.complaint_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.complaints to authenticated;
grant all on public.complaints to service_role;
alter table public.complaints enable row level security;
create policy "Reporter or admin read complaints" on public.complaints for select to authenticated
  using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Users file complaints" on public.complaints for insert to authenticated
  with check (reporter_id = auth.uid() and (booking_id is null or exists (
    select 1 from public.bookings b where b.id = booking_id and (b.customer_id = auth.uid() or public.is_booking_worker(b.worker_id)))));
create policy "Admin updates complaints" on public.complaints for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_complaint()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'open'; new.resolution_notes := null;
  else
    new.updated_at := now();
    if new.status is distinct from old.status or new.resolution_notes is distinct from old.resolution_notes then
      perform public.notify(new.reporter_id, 'Complaint updated', 'Your complaint "' || new.subject || '" is now ' || new.status || '.', 'complaint', new.booking_id);
    end if;
  end if;
  return new;
end $$;
create trigger trg_guard_complaint before insert or update on public.complaints
for each row execute function public.guard_complaint();

-- FAVOURITES
create table public.favourites (
  customer_id uuid not null,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, worker_id)
);
grant select, insert, delete on public.favourites to authenticated;
grant all on public.favourites to service_role;
alter table public.favourites enable row level security;
create policy "Own favourites" on public.favourites for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- ADMIN ACTIONS LOG
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  target_id uuid,
  details text,
  created_at timestamptz not null default now()
);
grant select, insert on public.admin_actions to authenticated;
grant all on public.admin_actions to service_role;
alter table public.admin_actions enable row level security;
create policy "Admin read log" on public.admin_actions for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admin write log" on public.admin_actions for insert to authenticated
  with check (admin_id = auth.uid() and public.has_role(auth.uid(),'admin'));

-- RPC: become worker
create or replace function public.become_worker()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'worker') on conflict do nothing;
end $$;
grant execute on function public.become_worker() to authenticated;

-- RPC: booking status transitions
create or replace function public.update_booking_status(_booking uuid, _status public.booking_status, _reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b record; is_worker boolean; is_customer boolean; wuser uuid; conflict_count int;
begin
  select * into b from public.bookings where id = _booking for update;
  if b is null then raise exception 'Booking not found'; end if;
  select user_id into wuser from public.worker_profiles where id = b.worker_id;
  is_worker := wuser = auth.uid();
  is_customer := b.customer_id = auth.uid();
  if not (is_worker or is_customer) then raise exception 'Not allowed'; end if;

  if _status in ('accepted','rejected') then
    if not is_worker or b.status <> 'pending' then raise exception 'Only the worker can accept or reject a pending request'; end if;
    if _status = 'accepted' and b.scheduled_at is not null then
      select count(*) into conflict_count from public.bookings o
       where o.worker_id = b.worker_id and o.id <> b.id and o.status in ('accepted','in_progress')
         and o.scheduled_at is not null and abs(extract(epoch from (o.scheduled_at - b.scheduled_at))) < 7200;
      if conflict_count > 0 then raise exception 'You already have an accepted job within 2 hours of this time'; end if;
    end if;
  elsif _status = 'in_progress' then
    if not is_worker or b.status <> 'accepted' then raise exception 'Only accepted bookings can be started by the worker'; end if;
  elsif _status = 'completed' then
    if not is_worker or b.status <> 'in_progress' then raise exception 'Only jobs in progress can be completed by the worker'; end if;
  elsif _status = 'cancelled' then
    if b.status not in ('pending','accepted') then raise exception 'This booking can no longer be cancelled'; end if;
  else
    raise exception 'Invalid status change';
  end if;

  update public.bookings set status = _status, updated_at = now(),
    cancel_reason = case when _status in ('cancelled','rejected') then _reason else cancel_reason end
  where id = _booking;

  if _status in ('pending','accepted','rejected','countered') then null; end if;
  update public.price_offers set status = 'withdrawn'
    where booking_id = _booking and status = 'pending' and _status in ('rejected','cancelled','completed');

  if _status = 'completed' then
    update public.worker_profiles set completed_jobs = completed_jobs + 1 where id = b.worker_id;
  end if;

  if is_worker then
    perform public.notify(b.customer_id, 'Booking ' || replace(_status::text,'_',' '), 'Your booking ' || b.booking_code || ' is now ' || replace(_status::text,'_',' ') || '.', 'booking_status', _booking);
  else
    perform public.notify(wuser, 'Booking ' || replace(_status::text,'_',' '), 'Booking ' || b.booking_code || ' was ' || replace(_status::text,'_',' ') || ' by the customer.', 'booking_status', _booking);
  end if;
end $$;
grant execute on function public.update_booking_status(uuid, public.booking_status, text) to authenticated;

-- RPC: make offer (initial quote, counter-offer)
create or replace function public.make_offer(_booking uuid, _amount numeric, _message text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare b record; wuser uuid; new_id uuid; other uuid;
begin
  select * into b from public.bookings where id = _booking for update;
  if b is null then raise exception 'Booking not found'; end if;
  select user_id into wuser from public.worker_profiles where id = b.worker_id;
  if auth.uid() is distinct from b.customer_id and auth.uid() is distinct from wuser then raise exception 'Not allowed'; end if;
  if b.status not in ('pending','accepted') then raise exception 'Negotiation is closed for this booking'; end if;
  if _amount is null or _amount <= 0 or _amount > 1000000 then raise exception 'Enter a valid amount'; end if;
  update public.price_offers set status = 'countered' where booking_id = _booking and status = 'pending' and offered_by <> auth.uid();
  update public.price_offers set status = 'withdrawn' where booking_id = _booking and status = 'pending' and offered_by = auth.uid();
  insert into public.price_offers (booking_id, offered_by, amount, message) values (_booking, auth.uid(), round(_amount,2), nullif(trim(_message),''))
    returning id into new_id;
  other := case when auth.uid() = b.customer_id then wuser else b.customer_id end;
  perform public.notify(other, 'New price offer', 'A new offer of ₹' || round(_amount)::text || ' was made on booking ' || b.booking_code || '.', 'price_offer', _booking);
  return new_id;
end $$;
grant execute on function public.make_offer(uuid, numeric, text) to authenticated;

-- RPC: respond to offer
create or replace function public.respond_offer(_offer uuid, _accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare o record; b record; wuser uuid;
begin
  select * into o from public.price_offers where id = _offer for update;
  if o is null or o.status <> 'pending' then raise exception 'This offer is no longer open'; end if;
  select * into b from public.bookings where id = o.booking_id for update;
  select user_id into wuser from public.worker_profiles where id = b.worker_id;
  if auth.uid() is distinct from b.customer_id and auth.uid() is distinct from wuser then raise exception 'Not allowed'; end if;
  if o.offered_by = auth.uid() then raise exception 'You cannot respond to your own offer'; end if;
  if b.status not in ('pending','accepted') then raise exception 'Negotiation is closed for this booking'; end if;
  if _accept then
    update public.price_offers set status = 'accepted' where id = _offer;
    update public.bookings set agreed_price = o.amount, updated_at = now() where id = b.id;
    perform public.notify(o.offered_by, 'Offer accepted', 'Your offer of ₹' || round(o.amount)::text || ' on booking ' || b.booking_code || ' was accepted.', 'offer_accepted', b.id);
  else
    update public.price_offers set status = 'rejected' where id = _offer;
    perform public.notify(o.offered_by, 'Offer declined', 'Your offer of ₹' || round(o.amount)::text || ' on booking ' || b.booking_code || ' was declined.', 'offer_rejected', b.id);
  end if;
end $$;
grant execute on function public.respond_offer(uuid, boolean) to authenticated;

-- RPC: admin verification
create or replace function public.admin_set_verification(_worker uuid, _status public.verification_status, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare w record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  if _status = 'rejected' and coalesce(trim(_note),'') = '' then raise exception 'A rejection reason is required'; end if;
  update public.worker_profiles set verification_status = _status, verification_note = _note where id = _worker returning * into w;
  insert into public.admin_actions (admin_id, action, target_id, details) values (auth.uid(), 'verification_' || _status, _worker, _note);
  perform public.notify(w.user_id, 'Verification ' || _status, coalesce('Your worker profile is now ' || _status || '. ' || _note, 'Your worker profile is now ' || _status || '.'), 'verification', null);
end $$;
grant execute on function public.admin_set_verification(uuid, public.verification_status, text) to authenticated;

create or replace function public.admin_set_suspension(_user uuid, _suspended boolean, _reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  if _user = auth.uid() then raise exception 'You cannot suspend yourself'; end if;
  update public.profiles set is_suspended = _suspended where id = _user;
  update public.worker_profiles set availability_status = 'offline' where user_id = _user and _suspended;
  insert into public.admin_actions (admin_id, action, target_id, details) values (auth.uid(), case when _suspended then 'suspend' else 'reactivate' end, _user, _reason);
end $$;
grant execute on function public.admin_set_suspension(uuid, boolean, text) to authenticated;

-- Admin user listing (emails from auth)
create or replace function public.admin_list_users(_search text default null)
returns table (id uuid, email text, full_name text, phone text, is_suspended boolean, roles text[], created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  return query
  select p.id, u.email::text, p.full_name, p.phone, p.is_suspended,
    array(select r.role::text from public.user_roles r where r.user_id = p.id), p.created_at
  from public.profiles p join auth.users u on u.id = p.id
  where _search is null or _search = '' or p.full_name ilike '%'||_search||'%' or u.email ilike '%'||_search||'%'
  order by p.created_at desc limit 200;
end $$;
grant execute on function public.admin_list_users(text) to authenticated;

-- Admin stats
create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  return json_build_object(
    'customers', (select count(*) from public.user_roles where role='customer'),
    'workers', (select count(*) from public.worker_profiles where not is_demo),
    'pending_verifications', (select count(*) from public.worker_profiles where verification_status='pending' and not is_demo and verification_submitted_at is not null),
    'bookings', (select count(*) from public.bookings),
    'completed', (select count(*) from public.bookings where status='completed'),
    'cancelled', (select count(*) from public.bookings where status='cancelled'),
    'open_complaints', (select count(*) from public.complaints where status in ('open','in_review'))
  );
end $$;
grant execute on function public.admin_stats() to authenticated;

-- Participant names for a booking (keeps profiles private otherwise)
create or replace function public.booking_parties(_booking uuid)
returns table (customer_name text, customer_phone text, worker_name text, worker_user_id uuid)
language plpgsql stable security definer set search_path = public as $$
declare b record; wuser uuid;
begin
  select * into b from public.bookings where id = _booking;
  if b is null then return; end if;
  select user_id into wuser from public.worker_profiles where id = b.worker_id;
  if auth.uid() is distinct from b.customer_id and auth.uid() is distinct from wuser and not public.has_role(auth.uid(),'admin') then
    raise exception 'Not allowed';
  end if;
  return query select p.full_name,
    case when b.status in ('accepted','in_progress','completed') or auth.uid() = b.customer_id then p.phone else null end,
    w.display_name, w.user_id
  from public.profiles p, public.worker_profiles w where p.id = b.customer_id and w.id = b.worker_id;
end $$;
grant execute on function public.booking_parties(uuid) to authenticated;

-- SEED: categories
insert into public.service_categories (name, slug, description, icon) values
 ('Plumbing','plumbing','Leaks, taps, pipelines and bathroom fittings','Wrench'),
 ('Electrical','electrical','Wiring, switches, fans and fixtures','Zap'),
 ('Cleaning','cleaning','Deep cleaning for homes and offices','Sparkles'),
 ('Painting','painting','Interior and exterior wall painting','PaintRoller'),
 ('Carpentry','carpentry','Furniture repair and woodwork','Hammer'),
 ('Cooking','cooking','Home cooks for daily meals and events','ChefHat'),
 ('Appliance Repair','appliance-repair','AC, fridge, washing machine and more','Refrigerator'),
 ('Gardening','gardening','Plant care, lawns and balcony gardens','Sprout'),
 ('Maid Services','maid-services','Daily household help','House'),
 ('Moving Services','moving-services','Packing, shifting and loading','Truck');

-- SEED: demo workers (clearly marked demo, not verified, no reviews)
with w as (
  insert into public.worker_profiles (display_name, bio, experience_years, locality, city, latitude, longitude, service_radius_km, verification_status, availability_status, working_hours, languages, is_demo)
  values
   ('Ramesh Patil (Demo)','Demonstration profile. Handles leak repairs, tap fittings and bathroom plumbing.',8,'Andheri West','Mumbai',19.1363,72.8277,8,'pending','available','Mon–Sat, 9 AM – 7 PM','{Marathi,Hindi}',true),
   ('Sunita Sharma (Demo)','Demonstration profile. Home deep-cleaning and kitchen cleaning.',5,'Bandra East','Mumbai',19.0596,72.8479,6,'pending','available','Daily, 8 AM – 5 PM','{Hindi,English}',true),
   ('Imran Shaikh (Demo)','Demonstration profile. House wiring, MCB, fan and light installation.',11,'Kurla','Mumbai',19.0726,72.8845,10,'pending','busy','Mon–Sun, 10 AM – 8 PM','{Hindi,Urdu,English}',true),
   ('Ganesh Kadam (Demo)','Demonstration profile. Interior wall painting and waterproofing.',9,'Dadar','Mumbai',19.0178,72.8478,12,'pending','available','Mon–Sat, 9 AM – 6 PM','{Marathi,Hindi}',true),
   ('Joseph D''Souza (Demo)','Demonstration profile. Furniture repair, modular fittings and woodwork.',14,'Malad West','Mumbai',19.1868,72.8484,10,'pending','offline','Tue–Sun, 10 AM – 6 PM','{English,Konkani,Hindi}',true),
   ('Lakshmi Iyer (Demo)','Demonstration profile. South and North Indian home cooking.',6,'Chembur','Mumbai',19.0522,72.9005,5,'pending','available','Daily, 7 AM – 2 PM','{Tamil,Hindi,English}',true)
  returning id, display_name
)
insert into public.worker_services (worker_id, category_id, description, base_price, pricing_unit)
select w.id, c.id, d.descr, d.price, d.unit::public.pricing_unit
from w join (values
  ('Ramesh Patil (Demo)','plumbing','Tap, pipe and flush repairs',350,'per_visit'),
  ('Sunita Sharma (Demo)','cleaning','Full home deep cleaning',1800,'per_job'),
  ('Sunita Sharma (Demo)','maid-services','Daily household help',250,'per_hour'),
  ('Imran Shaikh (Demo)','electrical','Wiring and fixture installation',300,'per_visit'),
  ('Imran Shaikh (Demo)','appliance-repair','AC and washing machine service',500,'per_visit'),
  ('Ganesh Kadam (Demo)','painting','Interior wall painting',1500,'per_day'),
  ('Joseph D''Souza (Demo)','carpentry','Furniture repair and fittings',400,'per_hour'),
  ('Lakshmi Iyer (Demo)','cooking','Daily home-cooked meals',6000,'per_job')
) as d(name, slug, descr, price, unit) on d.name = w.display_name
join public.service_categories c on c.slug = d.slug;
