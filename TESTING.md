# Forgex CRM — Role Testing Checklist

## BEFORE TESTING — Run this SQL in Supabase SQL editor once

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'invited_role', 'member')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirm admin role is set:
UPDATE profiles SET role = 'admin'
WHERE email = 'hi.hamza.dev@gmail.com';
```

## Setup (do once)
- [ ] Confirm admin account: hi.hamza.dev@gmail.com has role=admin in profiles table
- [ ] Confirm profile trigger exists in Supabase
- [ ] Confirm service role key is in .env.local as SUPABASE_SERVICE_ROLE_KEY

## Test 1 — Admin Role
Account: hi.hamza.dev@gmail.com
- [ ] Login with Google OAuth → lands on /dashboard
- [ ] Sidebar shows: Dashboard, Leads, Projects, Tasks, Blog, Content Calendar, Docs, Reports, Team, Notifications, Settings
- [ ] Can visit /team → sees team management page
- [ ] Can visit /reports → sees reports page
- [ ] Can visit /blog → sees blog page
- [ ] Can visit /projects → sees projects page
- [ ] Invite a Manager: go to /team → Invite → enter manager@test.com, role=Manager
- [ ] Invite a Member: go to /team → Invite → enter member@test.com, role=Lead Generator
- [ ] Sign out → lands on /login

## Test 2 — Manager Role
Account: manager@test.com (invited by admin)
- [ ] Receive invite email → click link → lands on /accept-invite
- [ ] Set password → redirected to /dashboard
- [ ] Sidebar shows: Dashboard, Leads, Projects, Tasks, Blog, Content Calendar, Docs, Notifications, Settings
- [ ] Sidebar does NOT show: Reports, Team
- [ ] Can visit /leads → sees leads page
- [ ] Can visit /projects → sees projects page
- [ ] Cannot visit /reports → redirected to /dashboard
- [ ] Cannot visit /team → redirected to /dashboard
- [ ] Sign out → lands on /login

## Test 3 — Member Role (Lead Generator)
Account: member@test.com (invited by admin)
- [ ] Receive invite email → click link → lands on /accept-invite
- [ ] Set password → redirected to /dashboard
- [ ] Sidebar shows: Dashboard, Leads, Tasks, Docs, Notifications, Settings
- [ ] Sidebar does NOT show: Projects, Blog, Content Calendar, Reports, Team
- [ ] Can visit /leads → sees leads page (own leads only)
- [ ] Can visit /tasks → sees tasks page (own tasks only)
- [ ] Cannot visit /projects → redirected to /dashboard
- [ ] Cannot visit /blog → redirected to /dashboard
- [ ] Cannot visit /reports → redirected to /dashboard
- [ ] Cannot visit /team → redirected to /dashboard
- [ ] Sign out → lands on /login

## Test 4 — Client Role (Portal)
Account: client@test.com (invited by admin or manager)
- [ ] Receive invite email → click link → lands on /portal/accept
- [ ] Set password → redirected to /portal/[projectId]
- [ ] Cannot visit /dashboard → redirected to /login or portal
- [ ] Cannot visit /leads → redirected
- [ ] Can view assigned project in portal
- [ ] Sign out → lands on /login
