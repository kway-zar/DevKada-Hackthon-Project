grant select on public.queue_entries to anon, authenticated;

grant update (
  blood_pressure,
  heart_rate,
  temperature,
  oxygen_saturation,
  vitals_taken_at
) on public.queue_entries to anon, authenticated;

drop policy if exists "public update queue vitals" on public.queue_entries;
create policy "public update queue vitals"
on public.queue_entries
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public read queue rows" on public.queue_entries;
create policy "public read queue rows"
on public.queue_entries
for select
to anon, authenticated
using (true);
