import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminQueries } from '@/hooks/useAdminQueries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus } from 'lucide-react';
import { LogOut, Check, X, ChevronUp, ChevronDown, Lock, Unlock, Plus, Trash2, Edit, Eye, EyeOff, Upload, Image as ImageIcon, Instagram } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'approvals' | 'members' | 'posts' | 'roles' | 'analytics'>('approvals');

  // Posts management state
  const [postsFilterMemberId, setPostsFilterMemberId] = useState<string>('all');
  
  // Use consolidated queries hook
  const { pending, members, roles, analytics, enableQuery } = useAdminQueries();

  // All member works for the Posts tab
  const { data: allWorks } = useQuery({
    queryKey: ['admin-all-works'],
    queryFn: async () => {
      const { data } = await supabase
        .from('member_works')
        .select('*, members(name, slug)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Edit member dialog state
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editPortraitUrl, setEditPortraitUrl] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New member state
  const [newRoleName, setNewRoleName] = useState('');

  // Add member dialog state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberSlug, setNewMemberSlug] = useState('');
  const [newMemberTitle, setNewMemberTitle] = useState<'Co-Founder' | 'Founder' | 'Partner' | 'Member'>('Member');

  // Open edit dialog
  const openEditDialog = (member: any) => {
    setEditingMember(member);
    setEditName(member.name || '');
    setEditBio(member.bio || '');
    setEditInstagram(member.instagram_url || '');
    setEditWebsite(member.website_url || '');
    setEditSlug(member.slug || '');
    setEditPortraitUrl(member.portrait_url || '');
    setIsEditDialogOpen(true);
  };

  // Save member edits
  const saveMemberEdits = async () => {
    if (!editingMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: editName,
          bio: editBio,
          instagram_url: editInstagram,
          website_url: editWebsite,
          slug: editSlug,
          portrait_url: editPortraitUrl,
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Member updated successfully' });
      setIsEditDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Upload portrait image
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingMember) return;
    const file = e.target.files[0];
    
    try {
      const ext = file.name.split('.').pop();
      const path = `portraits/${editingMember.id}_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      setEditPortraitUrl(publicUrl);
      toast({ title: 'Success', description: 'Portrait uploaded' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Delete member
  const deleteMember = async (memberId: string, memberName: string) => {
    try {
      // Delete member_roles first (foreign key constraint)
      await supabase.from('member_roles').delete().eq('member_id', memberId);
      
      // Delete member_works
      await supabase.from('member_works').delete().eq('member_id', memberId);
      
      // Delete pending_changes
      await supabase.from('pending_changes').delete().eq('member_id', memberId);
      
      // Delete analytics_events
      await supabase.from('analytics_events').delete().eq('member_id', memberId);
      
      // Finally delete the member
      const { error } = await supabase.from('members').delete().eq('id', memberId);
      
      if (error) throw error;

      toast({ 
        title: 'Deleted', 
        description: `${memberName} has been removed` 
      });
      
      qc.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
  };

  // Reorder a member's work — admin version, no approval needed
  const reorderAdminWork = async (works: any[], workId: string, direction: 'up' | 'down') => {
    const idx = works.findIndex((w: any) => w.id === workId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= works.length) return;
    try {
      await Promise.all([
        supabase.from('member_works').update({ display_order: works[swapIdx].display_order }).eq('id', works[idx].id),
        supabase.from('member_works').update({ display_order: works[idx].display_order }).eq('id', works[swapIdx].id),
      ]);
      qc.invalidateQueries({ queryKey: ['admin-all-works'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Delete an individual member work (admin only)
  const deleteWork = async (workId: string, workType: string, storagePath?: string | null) => {
    try {
      // If it's a file-based work, remove from storage first
      if (storagePath) {
        await supabase.storage.from('media').remove([storagePath]);
      }

      const { error } = await supabase.from('member_works').delete().eq('id', workId);
      if (error) throw error;

      toast({ title: 'Post deleted', description: 'The portfolio item has been removed.' });
      qc.invalidateQueries({ queryKey: ['admin-all-works'] });
      qc.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const approveChange = async (change: any) => {
    const { change_type, change_data, member_id, id } = change;
    const data = change_data as Record<string, any>;

    try {
      if (change_type === 'bio') {
        // Now handles name, bio, AND links together
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.bio) updateData.bio = data.bio;
        if (data.instagram_url !== undefined) updateData.instagram_url = data.instagram_url;
        if (data.website_url !== undefined) updateData.website_url = data.website_url;
        
        await supabase.from('members').update(updateData).eq('id', member_id);
        
      } else if (change_type === 'links') {
        // Legacy support for old link changes
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
        
        // Support both uploaded files AND Instagram URLs
        const insertData: any = {
          member_id,
          display_order: (count || 0),
        };

        if (data.storage_path) {
          // Regular file upload
          insertData.type = data.type || 'image';
          insertData.storage_path = data.storage_path;
          if (data.thumbnail_path) insertData.thumbnail_path = data.thumbnail_path;
        } else if (data.instagram_url) {
          // Instagram post embed — type must be 'instagram', storage_path stays null
          insertData.type = 'instagram';
          insertData.instagram_url = data.instagram_url;
        }
        
        await supabase.from('member_works').insert(insertData);
        
      } else if (change_type === 'media_remove') {
        await supabase.from('member_works').delete().eq('id', data.work_id);
        
      } else if (change_type === 'portrait') {
        await supabase.from('members').update({ portrait_url: data.portrait_url }).eq('id', member_id);
      }

      await supabase.from('pending_changes').update({ 
        status: 'approved', 
        reviewed_at: new Date().toISOString() 
      }).eq('id', id);
      
      toast({ title: 'Approved' });
      qc.invalidateQueries({ queryKey: ['admin-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const rejectChange = async (id: string) => {
    await supabase.from('pending_changes').update({ 
      status: 'rejected', 
      reviewed_at: new Date().toISOString() 
    }).eq('id', id);
    
    toast({ title: 'Rejected' });
    qc.invalidateQueries({ queryKey: ['admin-pending'] });
  };

  const toggleLock = async (memberId: string, currentLock: boolean) => {
    await supabase.from('members').update({ editing_locked: !currentLock }).eq('id', memberId);
    qc.invalidateQueries({ queryKey: ['admin-members'] });
    toast({ 
      title: currentLock ? 'Unlocked' : 'Locked',
      description: currentLock ? 'Member can now edit their profile' : 'Member editing disabled'
    });
  };

  const toggleVisibility = async (memberId: string, currentlyHidden: boolean) => {
    await supabase.from('members').update({ is_hidden: !currentlyHidden }).eq('id', memberId);
    qc.invalidateQueries({ queryKey: ['admin-members'] });
    qc.invalidateQueries({ queryKey: ['members'] });
    toast({
      title: currentlyHidden ? 'Profile visible' : 'Profile hidden',
      description: currentlyHidden
        ? 'This member now appears on the public main page.'
        : 'This member is hidden from the public main page.',
    });
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

  // ============================================
  // FIXED: Create Member - Works without admin API
  // ============================================
  const createMember = async () => {
    // Validation
    if (!newMemberEmail.trim() || !newMemberName.trim() || !newMemberSlug.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all required fields', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(newMemberSlug)) {
      toast({ 
        title: 'Error', 
        description: 'Slug must be lowercase with hyphens only (e.g., john-doe)', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Use RPC function to find user by email
      const { data: userId, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { user_email: newMemberEmail });
      
      if (rpcError || !userId) {
        toast({
          title: 'User Not Found',
          description: `No auth user found with email ${newMemberEmail}. Please invite them first through Supabase Dashboard → Authentication → Users.`,
          variant: 'destructive'
        });
        return;
      }

      // Create member with found user_id
      await createMemberRecord(userId);

    } catch (err: any) {
      console.error('Error creating member:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to create member', 
        variant: 'destructive' 
      });
    }
  };

  const createMemberRecord = async (userId: string) => {
    // Check if member already exists
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      toast({
        title: 'Already Exists',
        description: 'This user already has a member profile',
        variant: 'destructive'
      });
      return;
    }

    // Create member record
    const { error: memberError } = await supabase.from('members').insert({
      user_id: userId,
      name: newMemberName,
      slug: newMemberSlug,
      title: newMemberTitle,
      display_order: (members?.length || 0) + 1
    });

    if (memberError) throw memberError;

    // Add member role
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'member'
    });

    toast({ 
      title: 'Success!', 
      description: `Member ${newMemberName} created successfully` 
    });
    
    // Reset form
    setIsAddMemberOpen(false);
    setNewMemberEmail('');
    setNewMemberName('');
    setNewMemberSlug('');
    setNewMemberTitle('Member');
    
    // Refresh
    qc.invalidateQueries({ queryKey: ['admin-members'] });
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setNewMemberName(name);
    // Auto-generate slug: lowercase, replace spaces with hyphens
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
    setNewMemberSlug(slug);
  };

  const tabs = [
    { id: 'approvals' as const, label: 'Approvals', count: pending?.length },
    { id: 'members' as const, label: 'Members' },
    { id: 'posts' as const, label: 'Posts' },
    { id: 'roles' as const, label: 'Roles' },
    { id: 'analytics' as const, label: 'Analytics' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-foreground text-2xl tracking-wider">Admin Dashboard</h1>
          <Button 
            variant="ghost" 
            onClick={async () => { 
              await signOut(); 
              navigate('/'); 
            }} 
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                enableQuery(t.id as any);
              }}
              className={`font-heading text-sm tracking-widest px-4 py-2 border-b-2 transition-colors ${
                activeTab === t.id 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count ? <span className="ml-1 text-primary">({t.count})</span> : null}
            </button>
          ))}
        </div>

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {pending?.length === 0 && (
              <div className="text-center py-12">
                <Check className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground text-sm">No pending changes</p>
              </div>
            )}
            {pending?.map((pc: any) => {
              const data = pc.change_data as Record<string, any>;
              return (
                <div key={pc.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-foreground font-heading tracking-wider text-sm">{pc.members?.name || 'Unknown'}</span>
                      <span className="text-muted-foreground text-xs ml-2 capitalize">{pc.change_type.replace('_', ' ')}</span>
                      <span className="text-muted-foreground text-xs ml-2">• {new Date(pc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => approveChange(pc)} className="text-green-500 hover:text-green-400 hover:bg-green-500/10" title="Approve"><Check size={16} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => rejectChange(pc.id)} className="text-destructive hover:bg-destructive/10" title="Reject"><X size={16} /></Button>
                    </div>
                  </div>

                  {/* Portrait preview */}
                  {pc.change_type === 'portrait' && data.portrait_url && (
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">New portrait</p>
                        <img src={data.portrait_url} alt="new portrait" className="w-20 h-20 rounded-full object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Bio/profile text */}
                  {pc.change_type === 'bio' && (
                    <div className="mt-2 space-y-1.5 text-xs bg-muted/30 rounded p-3">
                      {data.name && <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">Name</span><span className="text-foreground">{data.name}</span></div>}
                      {data.bio && <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">Bio</span><span className="text-foreground line-clamp-3">{data.bio}</span></div>}
                      {data.instagram_url && <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">Instagram</span><span className="text-primary truncate">{data.instagram_url}</span></div>}
                      {data.website_url && <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">Website</span><span className="text-primary truncate">{data.website_url}</span></div>}
                    </div>
                  )}

                  {/* Uploaded image/video */}
                  {pc.change_type === 'media_add' && data.storage_path && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Uploaded {data.type}</p>
                      <img src={supabase.storage.from('media').getPublicUrl(data.storage_path).data.publicUrl} alt="upload" className="rounded-lg max-h-52 object-cover" />
                    </div>
                  )}

                  {/* Instagram embed */}
                  {pc.change_type === 'media_add' && data.instagram_url && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Instagram post to embed</p>
                      <a href={data.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline break-all block mb-2">{data.instagram_url}</a>
                      <div className="rounded-lg overflow-hidden border border-border">
                        <iframe
                          src={(() => { try { const u = new URL(data.instagram_url); return `https://www.instagram.com${u.pathname.replace(/\/$/, '')}/embed/`; } catch { return ''; } })()}
                          className="w-full" style={{ minHeight: '420px', border: 'none' }}
                          scrolling="no" allowTransparency={true} title="Instagram preview"
                        />
                      </div>
                    </div>
                  )}

                  {/* Media remove */}
                  {pc.change_type === 'media_remove' && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded p-2">Requesting removal of portfolio item</p>
                  )}

                  {/* Roles */}
                  {pc.change_type === 'roles' && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded p-2">
                      {(data.role_ids as string[])?.length ? `${(data.role_ids as string[]).length} role(s) selected` : 'Clearing all roles'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
              </p>
              
              {/* ADD MEMBER BUTTON */}
              <Button 
                onClick={() => setIsAddMemberOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus size={16} className="mr-2" />
                Add Member
              </Button>
            </div>
            
            {members?.map((m, i) => (
              <div key={m.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveOrder(m.id, 'up')} 
                      disabled={i === 0} 
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                      aria-label="Move up"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveOrder(m.id, 'down')} 
                      disabled={i === (members?.length || 0) - 1} 
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                      aria-label="Move down"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Portrait */}
                  {m.portrait_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={m.portrait_url} 
                        alt={m.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!m.portrait_url && (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-heading tracking-wider">{m.name}</p>
                      {m.is_hidden && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <EyeOff size={10} /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">@{m.slug}</p>
                  </div>

                  {/* Title Select */}
                  <Select defaultValue={m.title} onValueChange={(v) => updateTitle(m.id, v)}>
                    <SelectTrigger className="w-32 bg-card border-border text-foreground text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Co-Founder">Co-Founder</SelectItem>
                      <SelectItem value="Founder">Founder</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate(`/member/${m.slug}`)}
                      className="text-muted-foreground hover:text-foreground"
                      title="View profile"
                    >
                      <Eye size={16} />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => openEditDialog(m)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Edit member"
                    >
                      <Edit size={16} />
                    </Button>

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => toggleLock(m.id, m.editing_locked)} 
                      className={m.editing_locked ? 'text-destructive' : 'text-muted-foreground'}
                      title={m.editing_locked ? "Unlock editing" : "Lock editing"}
                    >
                      {m.editing_locked ? <Lock size={16} /> : <Unlock size={16} />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleVisibility(m.id, m.is_hidden ?? false)}
                      className={m.is_hidden ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'}
                      title={m.is_hidden ? "Show on main page" : "Hide from main page"}
                    >
                      {m.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete member"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {m.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this member and all their content (works, pending changes, analytics). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMember(m.id, m.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (() => {
          const filteredWorks = postsFilterMemberId === 'all'
            ? (allWorks || [])
            : (allWorks || []).filter((w: any) => w.member_id === postsFilterMemberId);

          return (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-sm text-muted-foreground shrink-0">
                  {filteredWorks.length} post{filteredWorks.length !== 1 ? 's' : ''}
                </p>
                <Select value={postsFilterMemberId} onValueChange={setPostsFilterMemberId}>
                  <SelectTrigger className="w-48 bg-card border-border text-foreground text-xs">
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {members?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredWorks.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No portfolio items found</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {filteredWorks.map((work: any, wi: number) => (
                  <div
                    key={work.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
                  >
                    {/* Type badge / preview */}
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {work.type === 'instagram' ? (
                        <Instagram size={22} className="text-pink-400" />
                      ) : work.thumbnail_path ? (
                        <img
                          src={supabase.storage.from('media').getPublicUrl(work.thumbnail_path).data.publicUrl}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      ) : work.storage_path && work.type === 'image' ? (
                        <img
                          src={supabase.storage.from('media').getPublicUrl(work.storage_path).data.publicUrl}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={22} className="text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-heading tracking-wider truncate">
                        {(work.members as any)?.name || 'Unknown'}
                      </p>
                      <p className="text-muted-foreground text-xs capitalize mt-0.5">
                        {work.type}
                        {work.instagram_url && (
                          <span className="ml-2 text-pink-400/80 truncate">
                            — {work.instagram_url}
                          </span>
                        )}
                        {work.storage_path && (
                          <span className="ml-2 opacity-60 truncate">
                            — {work.storage_path.split('/').pop()}
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Slot {work.display_order + 1} • {new Date(work.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Reorder — only shown when filtering by a single member */}
                      {postsFilterMemberId !== 'all' && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => reorderAdminWork(filteredWorks, work.id, 'up')}
                            disabled={wi === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                            title="Move up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            onClick={() => reorderAdminWork(filteredWorks, work.id, 'down')}
                            disabled={wi === filteredWorks.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                            title="Move down"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>
                      )}
                      {(work.members as any)?.slug && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/member/${(work.members as any).slug}`)}
                          className="text-muted-foreground hover:text-foreground"
                          title="View member page"
                        >
                          <Eye size={16} />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            title="Delete post"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this portfolio item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the{' '}
                              {work.type === 'instagram' ? 'Instagram post' : work.type}{' '}
                              from{' '}
                              {(work.members as any)?.name || 'this member'}'s portfolio.
                              {work.storage_path && ' The file will also be deleted from storage.'}
                              {' '}This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteWork(work.id, work.type, work.storage_path)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="New role name (e.g., Designer, Developer)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground max-w-xs"
              />
              <Button 
                onClick={addRole} 
                size="sm" 
                className="bg-primary text-primary-foreground font-heading tracking-widest"
              >
                <Plus size={14} className="mr-1" />
                Add Role
              </Button>
            </div>
            
            <div className="space-y-2">
              {roles?.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No roles yet. Add roles that members can select (e.g., Designer, Developer, Writer).
                </p>
              )}
              {roles?.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                  <span className="text-foreground text-sm font-medium">{r.name}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteRole(r.id)} 
                    className="text-destructive hover:bg-destructive/10"
                    aria-label={`Delete ${r.name}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-8">

            {/* Last 30 Days */}
            <div>
              <h3 className="font-heading text-foreground text-lg tracking-wider mb-3">Last 30 Days</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Total Views</p>
                  <p className="text-foreground font-heading text-4xl">{analytics?.last30?.totalViews || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Total Clicks</p>
                  <p className="text-foreground font-heading text-4xl">{analytics?.last30?.totalClicks || 0}</p>
                </div>
              </div>
              <div className="space-y-2">
                {analytics?.last30?.perMember && Object.entries(analytics.last30.perMember).map(([id, data]) => (
                  <div key={id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                    <span className="text-foreground font-medium">{data.name}</span>
                    <div className="flex gap-6 text-muted-foreground text-sm">
                      <span className="flex items-center gap-2">
                        <Eye size={14} />
                        {data.views} views
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {data.clicks} clicks
                      </span>
                    </div>
                  </div>
                ))}
                {analytics?.last30?.perMember && Object.keys(analytics.last30.perMember).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No data in the last 30 days.</p>
                )}
              </div>
            </div>

            {/* Last 365 Days */}
            <div>
              <h3 className="font-heading text-foreground text-lg tracking-wider mb-3">Last 365 Days</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Total Views</p>
                  <p className="text-foreground font-heading text-4xl">{analytics?.last365?.totalViews || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Total Clicks</p>
                  <p className="text-foreground font-heading text-4xl">{analytics?.last365?.totalClicks || 0}</p>
                </div>
              </div>
              <div className="space-y-2">
                {analytics?.last365?.perMember && Object.entries(analytics.last365.perMember).map(([id, data]) => (
                  <div key={id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                    <span className="text-foreground font-medium">{data.name}</span>
                    <div className="flex gap-6 text-muted-foreground text-sm">
                      <span className="flex items-center gap-2">
                        <Eye size={14} />
                        {data.views} views
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {data.clicks} clicks
                      </span>
                    </div>
                  </div>
                ))}
                {analytics?.last365?.perMember && Object.keys(analytics.last365.perMember).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No data in the last 365 days.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member: {editingMember?.name}</DialogTitle>
              <DialogDescription>
                Make changes to this member's profile. Changes are saved immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Portrait Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Profile Portrait</label>
                <div className="flex items-center gap-4">
                  {editPortraitUrl && (
                    <img 
                      src={editPortraitUrl} 
                      alt="Portrait preview" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload size={16} />
                      <span className="text-sm">Upload Portrait</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePortraitUpload}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Member name"
                  className="bg-card"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Slug (URL)</label>
                <Input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="member-slug"
                  className="bg-card font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /member/{editSlug || 'slug'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Member bio"
                  rows={4}
                  className="bg-card resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Instagram URL</label>
                <Input
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="bg-card"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Website URL</label>
                <Input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-card"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMemberEdits} className="bg-primary">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog - UPDATED */}
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">Add New Member</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a member profile for an existing user
              </DialogDescription>
            </DialogHeader>
            
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertDescription className="text-sm">
                <strong>First time?</strong> Go to Supabase Dashboard → Authentication → Users → "Invite User" 
                to create the auth account. Then return here to create their member profile.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  User Email *
                </label>
                <Input
                  type="email"
                  placeholder="member@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must match an existing user in Authentication
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Full Name *
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={newMemberName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  URL Slug *
                </label>
                <Input
                  type="text"
                  placeholder="john-doe"
                  value={newMemberSlug}
                  onChange={(e) => setNewMemberSlug(e.target.value)}
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be used in URL: /member/{newMemberSlug || 'slug'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Title
                </label>
                <Select value={newMemberTitle} onValueChange={(v: any) => setNewMemberTitle(v)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Co-Founder">Co-Founder</SelectItem>
                    <SelectItem value="Founder">Founder</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createMember} className="bg-primary">
                Create Member Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
