
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
      if not (old.verification_status = 'rejected' and new.verification_status = 'pending') then
        new.verification_status := old.verification_status;
        new.verification_note := old.verification_note;
      end if;
      new.rating_avg := old.rating_avg; new.review_count := old.review_count;
      new.completed_jobs := old.completed_jobs; new.is_demo := old.is_demo;
      new.user_id := old.user_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
