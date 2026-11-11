-- Ejecutar una vez en Supabase Dashboard > SQL Editor antes de usar la app autenticada.
alter table public.avistamientos
  add column if not exists entrenador_id uuid
  references auth.users (id) on delete set null;

create index if not exists avistamientos_entrenador_id_idx
  on public.avistamientos (entrenador_id);

alter table public.avistamientos enable row level security;

grant select on public.perros to authenticated;
grant select on public.avistamientos to authenticated;
grant insert on public.avistamientos to authenticated;
revoke insert on public.avistamientos from anon;

drop policy if exists "Usuarios autenticados pueden ver los perros"
  on public.perros;
create policy "Usuarios autenticados pueden ver los perros"
  on public.perros for select
  to authenticated
  using (true);

drop policy if exists "Usuarios autenticados pueden ver los avistamientos"
  on public.avistamientos;
create policy "Usuarios autenticados pueden ver los avistamientos"
  on public.avistamientos for select
  to authenticated
  using (true);

drop policy if exists "Cualquiera puede registrar un avistamiento"
  on public.avistamientos;
drop policy if exists "Entrenadores pueden registrar sus avistamientos"
  on public.avistamientos;
create policy "Entrenadores pueden registrar sus avistamientos"
  on public.avistamientos for insert
  to authenticated
  with check ((select auth.uid()) = entrenador_id);

drop policy if exists "Subir fotos de captura" on storage.objects;
create policy "Subir fotos de captura"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poliperrodex'
    and (storage.foldername(name))[1] = 'capturas'
    and storage.extension(name) = 'jpg'
  );
