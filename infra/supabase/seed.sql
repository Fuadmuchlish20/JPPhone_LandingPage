-- Example plans. Adjust prices/specs before going live.
insert into public.plans (slug, name, description, cpu, ram_mb, storage_gb, max_devices, price, period_days, idle_stop_minutes, sort_order, android_versions)
values
  ('uvip', 'UVIP', 'Popular games support, smooth experience', 3,  3072,  30, 1,  4.99, 30, null, 1, '{10,12,13,15}'),
  ('gvip', 'GVIP', 'Bigger RAM, 24/7 AFK',                     3,  4096,  64, 2,  7.99, 30, null, 2, '{10,12,13,15}'),
  ('kvip', 'KVIP', 'Cost effective, smooth AFK',               6,  5427,  64, 3, 12.99, 30, null, 3, '{10,12,13,15}'),
  ('mvip', 'MVIP', 'Higher performance, stable AFK',           8,  8192, 128, 5, 24.99, 30, null, 4, '{10,12,13,15}'),
  ('svip', 'SVIP', 'Premium RAM, stable AFK',                  8, 16384, 200, 8, 39.99, 30, null, 5, '{10,12,13,15}')
on conflict (slug) do nothing;

-- Example host (status flips to online on first agent heartbeat).
-- insert into public.hosts (name, region, public_url, capacity)
-- values ('host1', 'sg', 'https://host1.claudeemulator.net', 12);

-- Make yourself admin after signing up:
-- update public.profiles set is_admin = true where email = 'you@example.com';
