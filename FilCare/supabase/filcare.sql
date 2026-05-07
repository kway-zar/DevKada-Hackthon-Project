-- FilCare Supabase schema and common queries
--
-- Target features from the app:
-- - Patient pre-registration
-- - AI symptom triage
-- - Facility discovery by priority
-- - Virtual queue tracking
-- - Appointments and provider dashboard
-- - Medical records with QR-based patient access
--
-- Mutations can be executed through a service-role backend or by tightening RLS policies further.

create extension if not exists pgcrypto;
create extension if not exists postgis;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'provider', 'admin')),
  full_name text not null,
  email text unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  facility_type text not null check (facility_type in ('hospital', 'clinic', 'urgent_care', 'telemedicine')),
  address_line1 text not null,
  city text not null,
  state text not null default 'MA',
  postal_code text,
  location geography(point, 4326),
  phone text not null,
  emergency_hotline text,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  accepts_p1 boolean not null default false,
  accepts_p2 boolean not null default true,
  accepts_p3 boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_services (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  service_name text not null,
  created_at timestamptz not null default now(),
  unique (facility_id, service_name)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  license_number text unique,
  specialty text not null,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text not null unique default ('PT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_type text check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  phone text not null,
  email text,
  address text not null,
  city text not null,
  zip_code text not null,
  allergies text,
  medications text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  qr_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.symptom_triage_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  symptoms_text text not null,
  selected_symptoms text[] not null default '{}',
  duration text,
  severity text,
  priority text not null check (priority in ('P1', 'P2', 'P3')),
  priority_label text not null,
  estimated_wait text,
  recommendation text not null,
  ai_analysis text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  triage_assessment_id uuid references public.symptom_triage_assessments(id) on delete set null,
  queue_date date not null default current_date,
  queue_number integer not null,
  priority text not null check (priority in ('P1', 'P2', 'P3')),
  priority_label text not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'called', 'completed', 'cancelled')),
  check_in_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  estimated_wait_minutes integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, queue_date, queue_number)
);

-- Ensure vitals columns exist on queue_entries (BP, HR, Temp, SpO2)
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS blood_pressure text,
  ADD COLUMN IF NOT EXISTS heart_rate text,
  ADD COLUMN IF NOT EXISTS temperature text,
  ADD COLUMN IF NOT EXISTS oxygen_saturation text,
  ADD COLUMN IF NOT EXISTS vitals_taken_at timestamptz,
  ADD COLUMN IF NOT EXISTS vitals_taken_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_queue_entries_vitals ON public.queue_entries USING btree (
  blood_pressure,
  heart_rate,
  temperature,
  oxygen_saturation
) WHERE (blood_pressure IS NOT NULL);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  triage_assessment_id uuid references public.symptom_triage_assessments(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  appointment_type text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'in_progress', 'waiting', 'completed', 'cancelled')),
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  category text not null check (category in ('Laboratory', 'Medication', 'Radiology', 'Clinical', 'Immunization', 'Other')),
  record_type text not null,
  title text not null,
  description text,
  status text not null default 'completed' check (status in ('completed', 'active', 'pending', 'archived')),
  record_date date not null default current_date,
  file_name text,
  file_url text,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles (user_id);
create index if not exists idx_facilities_location on public.facilities using gist (location);
create index if not exists idx_facilities_type_active on public.facilities (facility_type, active);
create index if not exists idx_facility_services_facility_id on public.facility_services (facility_id);
create index if not exists idx_providers_facility_id on public.providers (facility_id);
create index if not exists idx_patients_user_id on public.patients (user_id);
create index if not exists idx_patients_patient_code on public.patients (patient_code);
create index if not exists idx_triage_patient_created_at on public.symptom_triage_assessments (patient_id, created_at desc);
create index if not exists idx_queue_facility_date_status on public.queue_entries (facility_id, queue_date, status);
create index if not exists idx_queue_patient on public.queue_entries (patient_id);
create index if not exists idx_appointments_date_status on public.appointments (appointment_date, status);
create index if not exists idx_appointments_patient on public.appointments (patient_id);
create index if not exists idx_medical_records_patient_date on public.medical_records (patient_id, record_date desc);
create index if not exists idx_medical_records_category on public.medical_records (category);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_facilities_updated_at on public.facilities;
create trigger trg_facilities_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

drop trigger if exists trg_providers_updated_at on public.providers;
create trigger trg_providers_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists trg_queue_entries_updated_at on public.queue_entries;
create trigger trg_queue_entries_updated_at
before update on public.queue_entries
for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists trg_medical_records_updated_at on public.medical_records;
create trigger trg_medical_records_updated_at
before update on public.medical_records
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_services enable row level security;
alter table public.providers enable row level security;
alter table public.patients enable row level security;
alter table public.symptom_triage_assessments enable row level security;
alter table public.queue_entries enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;

grant select on public.facilities to anon, authenticated;
grant select on public.facility_services to anon, authenticated;
grant select on public.accounts to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.providers to authenticated;
grant select on public.patients to authenticated;
grant select on public.symptom_triage_assessments to authenticated;
grant select on public.queue_entries to anon, authenticated;
grant update (
  blood_pressure,
  heart_rate,
  temperature,
  oxygen_saturation,
  vitals_taken_at,
  vitals_taken_by
) on public.queue_entries to anon, authenticated;
grant select on public.appointments to authenticated;
grant select on public.medical_records to authenticated;
grant insert on public.medical_records to anon, authenticated;
grant insert on public.patients to anon, authenticated;
grant update on public.patients to anon, authenticated;
grant insert on public.accounts to anon, authenticated;
grant update on public.accounts to anon, authenticated;

-- Public reference data for landing page and facility search.
drop policy if exists "public read facilities" on public.facilities;
create policy "public read facilities"
on public.facilities
for select
using (true);

drop policy if exists "public read facility services" on public.facility_services;
create policy "public read facility services"
on public.facility_services
for select
using (true);

-- User-owned profile access.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Patient and provider records are usually queried from a service-role backend,
-- but the following read policies make direct authenticated reads possible.
drop policy if exists "public read patient row" on public.patients;
create policy "public read patient row"
on public.patients
for select
to anon, authenticated
using (true);

drop policy if exists "public insert patient registration" on public.patients;
create policy "public insert patient registration"
on public.patients
for insert
with check (true);

drop policy if exists "public update patient registration" on public.patients;
create policy "public update patient registration"
on public.patients
for update
using (true)
with check (true);

drop policy if exists "read provider rows" on public.providers;
create policy "read provider rows"
on public.providers
for select
using (auth.uid() = user_id);

drop policy if exists "read triage rows" on public.symptom_triage_assessments;
create policy "read triage rows"
on public.symptom_triage_assessments
for select
using (auth.uid() = created_by_user_id);

drop policy if exists "read own queue rows" on public.queue_entries;
create policy "read own queue rows"
on public.queue_entries
for select
using (exists (
  select 1
  from public.patients p
  where p.id = queue_entries.patient_id
    and p.user_id = auth.uid()
));

drop policy if exists "public update queue vitals" on public.queue_entries;
create policy "public update queue vitals"
on public.queue_entries
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "read own appointments" on public.appointments;
create policy "read own appointments"
on public.appointments
for select
using (exists (
  select 1
  from public.patients p
  where p.id = appointments.patient_id
    and p.user_id = auth.uid()
));

drop policy if exists "read own medical records" on public.medical_records;
create policy "read own medical records"
on public.medical_records
for select
using (exists (
  select 1
  from public.patients p
  where p.id = medical_records.patient_id
    and p.user_id = auth.uid()
));

-- Allow public inserts into medical_records (development)
drop policy if exists "public insert medical records" on public.medical_records;
create policy "public insert medical records"
on public.medical_records
for insert
to anon, authenticated
with check (true);

create or replace view public.facility_catalog as
select
  f.id,
  f.name,
  f.facility_type,
  f.address_line1,
  f.city,
  f.state,
  f.postal_code,
  f.location,
  f.phone,
  f.emergency_hotline,
  f.rating,
  f.accepts_p1,
  f.accepts_p2,
  f.accepts_p3,
  f.active,
  coalesce(
    json_agg(fs.service_name order by fs.service_name) filter (where fs.service_name is not null),
    '[]'::json
  ) as capabilities
from public.facilities f
left join public.facility_services fs on fs.facility_id = f.id
group by f.id;

create or replace view public.provider_queue_dashboard as
select
  q.id,
  q.queue_date,
  q.queue_number,
  q.priority,
  q.priority_label,
  q.status,
  q.check_in_at,
  q.called_at,
  q.completed_at,
  q.estimated_wait_minutes,
  p.full_name as patient_name,
  p.patient_code,
  p.gender,
  p.blood_type,
  f.name as facility_name,
  t.symptoms_text,
  t.recommendation
from public.queue_entries q
join public.patients p on p.id = q.patient_id
join public.facilities f on f.id = q.facility_id
left join public.symptom_triage_assessments t on t.id = q.triage_assessment_id;

create or replace view public.today_appointments as
select
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.duration_minutes,
  a.appointment_type,
  a.status,
  p.full_name as patient_name,
  prov.specialty,
  f.name as facility_name
from public.appointments a
join public.patients p on p.id = a.patient_id
left join public.providers prov on prov.id = a.provider_id
left join public.facilities f on f.id = a.facility_id;

create or replace function public.next_queue_number(p_facility_id uuid, p_queue_date date default current_date)
returns integer
language sql
stable
as $$
  select coalesce(max(queue_number), 0) + 1
  from public.queue_entries
  where facility_id = p_facility_id
    and queue_date = p_queue_date;
$$;

grant select on public.facility_catalog to anon, authenticated;
grant select on public.provider_queue_dashboard to anon, authenticated;
grant select on public.today_appointments to authenticated;
grant execute on function public.next_queue_number(uuid, date) to authenticated;

-- Common application queries

-- 1) Patient pre-registration
-- insert into public.patients (
--   first_name, last_name, date_of_birth, gender, blood_type, phone, email,
--   address, city, zip_code, allergies, medications, emergency_contact_name,
--   emergency_contact_phone, user_id
-- ) values (...)

-- 2) Save a triage assessment after the symptom checker
-- insert into public.symptom_triage_assessments (
--   patient_id, created_by_user_id, symptoms_text, selected_symptoms, duration,
--   severity, priority, priority_label, estimated_wait, recommendation, ai_analysis
-- ) values (...)

-- 3) Load nearby facilities for a given priority
-- select *
-- from public.facility_catalog
-- where active = true
--   and (
--     (:priority = 'P1' and accepts_p1 = true and facility_type = 'hospital') or
--     (:priority = 'P2' and accepts_p2 = true) or
--     (:priority = 'P3' and accepts_p3 = true)
--   )
-- order by rating desc, name asc;

-- 4) Create a queue entry
-- insert into public.queue_entries (
--   facility_id, patient_id, triage_assessment_id, queue_date, queue_number,
--   priority, priority_label, status, estimated_wait_minutes
-- ) values (
--   :facility_id,
--   :patient_id,
--   :triage_assessment_id,
--   current_date,
--   public.next_queue_number(:facility_id, current_date),
--   :priority,
--   :priority_label,
--   'waiting',
--   :estimated_wait_minutes
-- ) returning *;

-- 5) Provider dashboard queue ordered by priority and arrival
-- select *
-- from public.provider_queue_dashboard
-- where queue_date = current_date
-- order by
--   case priority when 'P1' then 1 when 'P2' then 2 else 3 end,
--   queue_number asc;

-- 6) Appointments for a chosen day
-- select *
-- from public.today_appointments
-- where appointment_date = :selected_date
-- order by appointment_time asc;

-- 7) Medical records for a patient
-- select *
-- from public.medical_records
-- where patient_id = :patient_id
-- order by record_date desc, created_at desc;

-- 8) QR lookup by patient code or token
-- select *
-- from public.patients
-- where patient_code = :patient_code
--    or qr_token = :qr_token;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS address text;
BEGIN;

CREATE TABLE IF NOT EXISTS public.accounts (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
email text NOT NULL UNIQUE,
password_hash text NOT NULL,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_patient_id ON public.accounts(patient_id);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.accounts (patient_id, email, password_hash)
SELECT p.id, p.email, COALESCE(p.password_hash, '')
FROM public.patients p
WHERE p.email IS NOT NULL
ON CONFLICT (patient_id) DO NOTHING;


COMMIT;

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS account_type text
CHECK (account_type IN ('patient', 'provider', 'admin'))
DEFAULT 'patient';

-- Step 1: Modify the accounts table structure
ALTER TABLE public.accounts 
  -- Remove the strict link to auth.users if you are bypassing Supabase Auth
  -- Add a column for the password (since it's no longer in auth.users)
  ADD COLUMN IF NOT EXISTS password_hash text NOT NULL,
  
  -- Add the account_type column with a default
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'patient' 
    CHECK (account_type IN ('patient', 'provider', 'admin')),

  -- Allow the account to link to EITHER a patient or a provider
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE;

-- Step 2: Create a function for automatic role assignment
CREATE OR REPLACE FUNCTION public.determine_account_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatic logic: If email ends in @filcare.ph, it's a provider
  IF NEW.email LIKE '%@filcare.ph' THEN
    NEW.account_type := 'provider';
  ELSE
    NEW.account_type := 'patient';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Attach the trigger to handle "automatic" type assignment
DROP TRIGGER IF EXISTS trg_auto_account_type ON public.accounts;
CREATE TRIGGER trg_auto_account_type
BEFORE INSERT ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.determine_account_type();

-- 1. Allow anyone (even unauthenticated guests) to create an account
-- This is necessary for the initial signup process.
CREATE POLICY "Enable insert for registration" 
ON public.accounts 
FOR INSERT 
WITH CHECK (true);

-- 2. Ensure users can only read their own account data
-- Using the email or the custom ID for the check.
CREATE POLICY "Users can view own account" 
ON public.accounts 
FOR SELECT 
USING (true); -- Note: In production, refine this to verify identity.

drop policy if exists "public update account" on public.accounts;
create policy "public update account"
on public.accounts
for update
using (true)
with check (true);

-- 1. Modify accounts to allow null patient_id (for providers) and auto-increment
ALTER TABLE public.accounts 
  ALTER COLUMN patient_id DROP NOT NULL,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(); -- Uses UUID for security

-- 2. If you prefer integer auto-increment for other tables (e.g., facilities)
-- Note: UUIDs (gen_random_uuid()) are standard for Supabase, 
-- but here is how to set a sequence for an integer ID:
-- ALTER TABLE public.facilities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

-- 3. Update the trigger to handle the "Automatic" account type logic
CREATE OR REPLACE FUNCTION public.determine_account_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic: @filcare.ph emails are providers, others are patients
  IF NEW.email LIKE '%@filcare.ph' THEN
    NEW.account_type := 'provider';
  ELSE
    NEW.account_type := 'patient';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


drop policy if exists "public insert patient registration" on public.patients;
create policy "public insert patient registration"
on public.patients
for insert
with check (true);

grant insert on public.patients to anon, authenticated;


/**/
alter table public.patients enable row level security;

grant insert on public.patients to anon, authenticated;

drop policy if exists "public insert patient registration" on public.patients;
create policy "public insert patient registration"
on public.patients
for insert
to anon, authenticated
with check (true);

drop policy if exists "read own patient row" on public.patients;
create policy "read own patient row"
on public.patients
for select
to authenticated
using (auth.uid() = user_id);

ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_user_id_fkey;

ALTER TABLE public.patients
ADD CONSTRAINT patients_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL;

grant select on public.accounts to anon, authenticated;
grant insert on public.accounts to anon, authenticated;
grant update on public.accounts to anon, authenticated;


grant select on public.patients to anon, authenticated;
