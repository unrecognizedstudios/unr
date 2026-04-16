
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Member title enum
CREATE TYPE public.member_title AS ENUM ('Founder', 'Partner', 'Member');

-- Members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title member_title NOT NULL DEFAULT 'Member',
  bio TEXT DEFAULT '',
  portrait_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  editing_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Available creative roles (admin-managed)
CREATE TABLE public.available_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.available_roles ENABLE ROW LEVEL SECURITY;

-- Member creative roles (many-to-many)
CREATE TABLE public.member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.available_roles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (member_id, role_id)
);
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;

-- Member works (media)
CREATE TABLE public.member_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.member_works ENABLE ROW LEVEL SECURITY;

-- Pending changes (approval queue)
CREATE TABLE public.pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('bio', 'links', 'roles', 'media_add', 'media_remove', 'portrait')),
  change_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'link_click')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- user_roles: admins can read all, users can read their own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- members: public read, admins full access, members update own (if not locked)
CREATE POLICY "Public can view members" ON public.members
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage members" ON public.members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can update own profile" ON public.members
  FOR UPDATE USING (auth.uid() = user_id AND NOT editing_locked)
  WITH CHECK (auth.uid() = user_id AND NOT editing_locked);

-- available_roles: public read, admin manage
CREATE POLICY "Public can view available roles" ON public.available_roles
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage available roles" ON public.available_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- member_roles: public read, admin manage
CREATE POLICY "Public can view member roles" ON public.member_roles
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage member roles" ON public.member_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- member_works: public read, admin manage
CREATE POLICY "Public can view works" ON public.member_works
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage works" ON public.member_works
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- pending_changes: members can view/create own, admins can manage all
CREATE POLICY "Members can view own pending changes" ON public.pending_changes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = member_id AND user_id = auth.uid())
  );
CREATE POLICY "Members can create pending changes" ON public.pending_changes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = member_id AND user_id = auth.uid() AND NOT editing_locked)
  );
CREATE POLICY "Admins can manage pending changes" ON public.pending_changes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- analytics_events: public insert (for tracking), members see own, admins see all
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view own analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = member_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE ============

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage media" ON storage.objects
  FOR ALL USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
