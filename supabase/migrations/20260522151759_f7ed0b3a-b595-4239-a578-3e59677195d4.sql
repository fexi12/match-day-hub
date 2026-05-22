
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "Public read player photos"
on storage.objects for select
using (bucket_id = 'player-photos');

create policy "Authenticated upload player photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'player-photos');

create policy "Authenticated update player photos"
on storage.objects for update
to authenticated
using (bucket_id = 'player-photos');

create policy "Authenticated delete player photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'player-photos');
