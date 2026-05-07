grant select on public.medical_records to anon, authenticated;
grant insert on public.medical_records to anon, authenticated;

drop policy if exists "public insert medical records" on public.medical_records;
create policy "public insert medical records"
on public.medical_records
for insert
to anon, authenticated
with check (true);

drop policy if exists "public read medical records" on public.medical_records;
create policy "public read medical records"
on public.medical_records
for select
to anon, authenticated
using (true);
