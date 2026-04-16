import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Check, X, ChevronUp, ChevronDown, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'approvals' | 'members' | 'roles' | 'analytics' | 'create'>('approvals');

  // Pending changes
  const { data: pending } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_changes')
        .select('*, members(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // All members
  const { data: members } = useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('display_order');
      return data || [];
    },
  });

  // Available roles
  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('available_roles').select('*').order('name');
      return data || [];
    },
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, member_id, members(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      
      const totalViews = events?.filter(e => e.event_type === 'page_view').length || 0;
      const totalClicks = events?.filter(e => e.event_type === 'link_click').length || 0;
      
      // Per member breakdown
      const perMember: Record<string, { name: string; views: number; clicks: number }> = {};
      events?.forEach((e: any) => {
        if (!e.member_id) return;
        if (!perMember[e.member_id]) {
          perMember[e.member_id] = { name: e.members?.name || 'Unknown', views: 0, clicks: 0 };
        }
        if (e.event_type === 'page_view') perMember[e.member_id].views++;
        else perMember[e.member_id].clicks++;
      });

      return { totalViews, totalClicks, perMember };
    },
  });

  const approveChange = async (change: any) => {
    const { change_type, change_data, member_id, id } = change;
    const data = change_data as Record<string, any>;

    try {
      if (change_type === 'bio') {
        await supabase.from('members').update({ bio: data.bio }).eq('id', member_id);
      } else if (change_type === 'links') {
        await supabase.from('members').update({
          instagram_url: data.instagram_url,
          website_url: data.website_url,
        }).eq('id', member_id);
      } else if (change_type === 'roles') {
        await supabase.from('member_roles').delete().eq('member_id', member_id);
        const inserts = (data.role_ids as string[]).map(role_id => ({ member_id, role_id }));
        if (inserts.length > 0) await supabase.from('member_roles').insert(inserts);
      } else if (change_type === 'media_add') {
        const { count } = await supabase.from('member_works').select('id', { count: 'exact', head: true }).eq('member_id', member_id);
        if ((count || 0) >= 6) {
          toast({ title: 'Error', description: 'Member already has 6 works', variant: 'destructive' });
          return;
        }
        await supabase.from('member_works').insert({
          member_id,
          type: data.type,
          storage_path: data.storage_path,
          display_order: (count || 0),
        });
      } else if (change_type === 'media_remove') {
        await supabase.from('member_works').delete().eq('id', data.work_id);
      } else if (change_type === 'portrait') {
        await supabase.from('members').update({ portrait_url: data.portrait_url }).eq('id', member_id);
      }

      await supabase.from('pending_changes').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
      toast({ title: 'Approved' });
      qc.invalidateQueries({ queryKey: ['admin-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const rejectChange = async (id: string) => {
    await supabase.from('pending_changes').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'Rejected' });
    qc.invalidateQueries({ queryKey: ['admin-pending'] });
  };

  const toggleLock = async (memberId: string, currentLock: boolean) => {
    await supabase.from('members').update({ editing_locked: !currentLock }).eq('id', memberId);
    qc.invalidateQueries({ queryKey: ['admin-members'] });
  };

  const updateTitle = async (memberId: string, title: string) => {
    await supabase.from('members').update({ title: title as any }).eq('id', memberId);
    qc.invalidateQueries({ queryKey: ['admin-members'] });
    toast({ title: 'Title updated' });
  };

  const moveOrder = async (memberId: string, direction: 'up' | 'down') => {
    if (!members) return;
    const idx = members.findIndex(m => m.id === memberId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= members.length) return;
    
    await Promise.all([
      supabase.from('members').update({ display_order: members[swapIdx].display_order }).eq('id', members[idx].id),
      supabase.from('members').update({ display_order: members[idx].display_order }).eq('id', members[swapIdx].id),
    ]);
    qc.invalidateQueries({ queryKey: ['admin-members'] });
  };

  // Create member
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  const createMember = async () => {
    if (!newEmail || !newPassword || !newName) return;
    // Note: In production, use an edge function to create users via admin API
    // For now we create via signUp then immediately set role
    toast({ title: 'Note', description: 'Member account creation requires the Supabase admin API. Use the Cloud dashboard to create user accounts, then add them as members here.' });
  };

  const addRole = async () => {
    if (!newRoleName.trim()) return;
    const { error } = await supabase.from('available_roles').insert({ name: newRoleName.trim() });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Role added' });
      setNewRoleName('');
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
    }
  };

  const deleteRole = async (id: string) => {
    await supabase.from('available_roles').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-roles'] });
    toast({ title: 'Role removed' });
  };

  const tabs = [
    { id: 'approvals' as const, label: 'Approvals', count: pending?.length },
    { id: 'members' as const, label: 'Members' },
    { id: 'roles' as const, label: 'Roles' },
    { id: 'analytics' as const, label: 'Analytics' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-foreground text-2xl tracking-wider">Admin</h1>
          <Button variant="ghost" onClick={async () => { await signOut(); navigate('/'); }} className="text-muted-foreground hover:text-foreground">
            <LogOut size={18} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`font-heading text-sm tracking-widest px-4 py-2 border-b-2 transition-colors ${
                activeTab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count ? <span className="ml-1 text-primary">({t.count})</span> : null}
            </button>
          ))}
        </div>

        {/* Approvals */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            {pending?.length === 0 && <p className="text-muted-foreground text-sm">No pending changes.</p>}
            {pending?.map((pc: any) => (
              <div key={pc.id} className="bg-card border border-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-foreground font-heading tracking-wider text-sm">
                      {pc.members?.name || 'Unknown'}
                    </span>
                    <span className="text-muted-foreground text-xs ml-2 capitalize">
                      {pc.change_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => approveChange(pc)} className="text-green-500 hover:text-green-400 hover:bg-green-500/10">
                      <Check size={16} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => rejectChange(pc.id)} className="text-destructive hover:bg-destructive/10">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                <pre className="text-muted-foreground text-xs overflow-auto">
                  {JSON.stringify(pc.change_data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Members */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            {members?.map((m, i) => (
              <div key={m.id} className="bg-card border border-border rounded p-4 flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveOrder(m.id, 'up')} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveOrder(m.id, 'down')} disabled={i === (members?.length || 0) - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-heading tracking-wider">{m.name}</p>
                  <p className="text-muted-foreground text-xs">{m.title}</p>
                </div>
                <Select defaultValue={m.title} onValueChange={(v) => updateTitle(m.id, v)}>
                  <SelectTrigger className="w-32 bg-card border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Founder">Founder</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => toggleLock(m.id, m.editing_locked)} className={m.editing_locked ? 'text-destructive' : 'text-muted-foreground'}>
                  {m.editing_locked ? <Lock size={16} /> : <Unlock size={16} />}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Roles */}
        {activeTab === 'roles' && (
          <div>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="New role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground max-w-xs"
              />
              <Button onClick={addRole} size="sm" className="bg-primary text-primary-foreground font-heading tracking-widest">
                <Plus size={14} />
              </Button>
            </div>
            <div className="space-y-2">
              {roles?.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded p-3">
                  <span className="text-foreground text-sm">{r.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteRole(r.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-widest">Total Views</p>
                <p className="text-foreground font-heading text-3xl mt-1">{analytics?.totalViews || 0}</p>
              </div>
              <div className="bg-card border border-border rounded p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-widest">Total Clicks</p>
                <p className="text-foreground font-heading text-3xl mt-1">{analytics?.totalClicks || 0}</p>
              </div>
            </div>
            <h3 className="font-heading text-foreground text-lg tracking-wider mb-3">Per Member</h3>
            <div className="space-y-2">
              {analytics?.perMember && Object.entries(analytics.perMember).map(([id, data]) => (
                <div key={id} className="bg-card border border-border rounded p-3 flex items-center justify-between">
                  <span className="text-foreground text-sm">{data.name}</span>
                  <div className="flex gap-4 text-muted-foreground text-xs">
                    <span>{data.views} views</span>
                    <span>{data.clicks} clicks</span>
                  </div>
                </div>
              ))}
              {analytics?.perMember && Object.keys(analytics.perMember).length === 0 && (
                <p className="text-muted-foreground text-sm">No analytics data yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
