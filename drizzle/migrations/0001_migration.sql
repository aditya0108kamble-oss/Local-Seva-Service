
create policy "Avatar owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatar owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatar owner read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Docs owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Docs owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

-- trigger: worker submitting for verification marks timestamp
create or replace function public.submit_verification()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.worker_profiles set verification_submitted_at = now(),
    verification_status = case when verification_status = 'rejected' then 'pending'::public.verification_status else verification_status end
  where user_id = auth.uid();
end $$;
grant execute on function public.submit_verification() to authenticated;
