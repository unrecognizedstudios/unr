import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LogOut } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MemberDashboard = () => {
  const { user, role, memberId, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch member data
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['dashboard-member', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase.from('members').select('*').eq('id', memberId).single();
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch available roles
  const { data: availableRoles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('available_roles').select('*');
      return data || [];
    },
  });

  // Fetch member's current roles
  const { data: memberRoles } = useQuery({
    queryKey: ['member-roles', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase.from('member_roles').select('role_id').eq('member_id', memberId);
      return data?.map((r) => r.role_id) || [];
    },
    enabled: !!memberId,
  });

  // Fetch pending changes
  const { data: pendingChanges } = useQuery({
    queryKey: ['pending-changes', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from('pending_changes')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!memberId,
  });

  // Fetch member works
  const { data: works } = useQuery({
    queryKey: ['member-works-dashboard', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from('member_works')
        .select('*')
        .eq('member_id', memberId)
        .order('display_order');
      return data || [];
    },
    enabled: !!memberId,
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['member-analytics', memberId],
    queryFn: async () => {
      if (!memberId) return { views: 0, clicks: 0 };
      const [views, clicks] = await Promise.all([
        supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('event_type', 'page_view'),
        supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('event_type', 'link_click'),
      ]);
      return { views: views.count || 0, clicks: clicks.count || 0 };
    },
    enabled: !!memberId,
  });

  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (member) {
      setBio(member.bio || '');
      setInstagram(member.instagram_url || '');
      setWebsite(member.website_url || '');
    }
  }, [member]);

  useEffect(() => {
    if (memberRoles) setSelectedRoles(memberRoles);
  }, [memberRoles]);

  if (role === 'admin') {
    navigate('/admin');
    return null;
  }

  const isLocked = member?.editing_locked;

  const submitChange = async (changeType: string, changeData: Record<string, any>) => {
    if (!memberId || isLocked) return;
    const { error } = await supabase.from('pending_changes').insert({
      member_id: memberId,
      change_type: changeType,
      change_data: changeData,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Submitted', description: 'Your changes are pending admin approval.' });
      queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
    }
  };

  const handleSaveBio = () => submitChange('bio', { bio });
  const handleSaveLinks = () => submitChange('links', { instagram_url: instagram, website_url: website });
  const handleSaveRoles = () => submitChange('roles', { role_ids: selectedRoles });

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !memberId) return;
    const file = e.target.files[0];
    const currentCount = works?.length || 0;
    if (currentCount >= 6) {
      toast({ title: 'Limit reached', description: 'Maximum 6 works allowed.', variant: 'destructive' });
      return;
    }
    const ext = file.name.split('.').pop();
    const path = `${memberId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const type = file.type.startsWith('video') ? 'video' : 'image';
    await submitChange('media_add', { storage_path: path, type });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (memberLoading) return <div className="min-h-screen bg-background" />;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-foreground text-2xl tracking-wider">Dashboard</h1>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut size={18} />
          </Button>
        </div>

        {isLocked && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-4 mb-6">
            <p className="text-destructive text-sm">Your editing access has been disabled by an admin.</p>
          </div>
        )}

        {/* Analytics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Page Views</p>
            <p className="text-foreground font-heading text-2xl mt-1">{analytics?.views || 0}</p>
          </div>
          <div className="bg-card border border-border rounded p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Link Clicks</p>
            <p className="text-foreground font-heading text-2xl mt-1">{analytics?.clicks || 0}</p>
          </div>
        </div>

        {/* Bio */}
        <section className="mb-8">
          <h2 className="font-heading text-foreground text-lg tracking-wider mb-3">Bio</h2>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isLocked}
            className="bg-card border-border text-foreground mb-2 resize-none"
            rows={3}
          />
          <Button onClick={handleSaveBio} disabled={isLocked} size="sm" className="bg-primary text-primary-foreground font-heading tracking-widest">
            Submit Bio
          </Button>
        </section>

        {/* Links */}
        <section className="mb-8">
          <h2 className="font-heading text-foreground text-lg tracking-wider mb-3">Links</h2>
          <div className="space-y-2 mb-2">
            <Input
              placeholder="Instagram URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={isLocked}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            <Input
              placeholder="Website URL"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isLocked}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button onClick={handleSaveLinks} disabled={isLocked} size="sm" className="bg-primary text-primary-foreground font-heading tracking-widest">
            Submit Links
          </Button>
        </section>

        {/* Roles */}
        <section className="mb-8">
          <h2 className="font-heading text-foreground text-lg tracking-wider mb-3">Roles</h2>
          <div className="space-y-2 mb-2">
            {availableRoles?.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-foreground text-sm cursor-pointer">
                <Checkbox
                  checked={selectedRoles.includes(r.id)}
                  onCheckedChange={(checked) => {
                    setSelectedRoles((prev) =>
                      checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                    );
                  }}
                  disabled={isLocked}
                />
                {r.name}
              </label>
            ))}
          </div>
          <Button onClick={handleSaveRoles} disabled={isLocked} size="sm" className="bg-primary text-primary-foreground font-heading tracking-widest">
            Submit Roles
          </Button>
        </section>

        {/* Media Upload */}
        <section className="mb-8">
          <h2 className="font-heading text-foreground text-lg tracking-wider mb-3">
            Media ({works?.length || 0}/6)
          </h2>
          {!isLocked && (works?.length || 0) < 6 && (
            <label className="block cursor-pointer">
              <div className="bg-card border border-dashed border-border rounded p-6 text-center text-muted-foreground text-sm hover:border-primary/50 transition-colors">
                Click to upload image or video
              </div>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            </label>
          )}
        </section>

        {/* Pending Changes */}
        <section>
          <h2 className="font-heading text-foreground text-lg tracking-wider mb-3">Recent Submissions</h2>
          {pendingChanges?.length === 0 && (
            <p className="text-muted-foreground text-sm">No submissions yet.</p>
          )}
          <div className="space-y-2">
            {pendingChanges?.map((pc) => (
              <div key={pc.id} className="bg-card border border-border rounded p-3 flex items-center justify-between">
                <div>
                  <span className="text-foreground text-sm capitalize">{pc.change_type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {new Date(pc.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-xs uppercase tracking-widest ${
                  pc.status === 'approved' ? 'text-green-500' :
                  pc.status === 'rejected' ? 'text-destructive' :
                  'text-yellow-500'
                }`}>
                  {pc.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default MemberDashboard;
