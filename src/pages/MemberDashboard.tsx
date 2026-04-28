import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMemberDashboard } from '@/hooks/useMemberDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Upload, Check, Clock, X, TrendingUp, MousePointerClick, Trash2, Image as ImageIcon, Instagram, ChevronUp, ChevronDown } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MemberDashboard = () => {
  const { user, role, memberId, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    member,
    availableRoles,
    memberRoles,
    pendingChanges,
    works,
    analytics,
    isLoading: memberLoading,
  } = useMemberDashboard(memberId);

  // Profile edit state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Portrait upload state
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  // Portfolio management state
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [workUploadType, setWorkUploadType] = useState<'upload' | 'instagram'>('upload');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
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
  const isHidden = (member as any)?.is_hidden ?? false;

  const submitChange = async (changeType: string, changeData: Record<string, any>) => {
    if (!memberId || isLocked) return;
    try {
      const { error } = await supabase.from('pending_changes').insert({
        member_id: memberId,
        change_type: changeType,
        change_data: changeData,
      });
      if (error) throw error;
      toast({ title: 'Submitted for Approval', description: 'Your changes will be reviewed by an admin.' });
      queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveProfile = () => {
    if (!name.trim()) { toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' }); return; }
    if (!bio.trim()) { toast({ title: 'Error', description: 'Bio cannot be empty', variant: 'destructive' }); return; }
    submitChange('bio', { name, bio, instagram_url: instagram, website_url: website });
  };

  const handleSaveRoles = () => {
    submitChange('roles', { role_ids: selectedRoles });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !memberId) return;
    const file = e.target.files[0];
    if ((works?.length || 0) >= 6) {
      toast({ title: 'Limit Reached', description: 'You can only have up to 6 portfolio items.', variant: 'destructive' });
      return;
    }
    setUploadingFile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `works/${memberId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) throw uploadError;
      const type = file.type.startsWith('video') ? 'video' : 'image';
      await submitChange('media_add', { storage_path: path, type });
      setIsAddWorkOpen(false);
      toast({ title: 'Uploaded!', description: 'Pending admin approval' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleInstagramSubmit = () => {
    if ((works?.length || 0) >= 6) {
      toast({ title: 'Limit Reached', description: 'You can only have up to 6 portfolio items.', variant: 'destructive' });
      return;
    }
    if (!instagramUrl.trim() || !instagramUrl.includes('instagram.com')) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid Instagram post URL', variant: 'destructive' });
      return;
    }
    submitChange('media_add', { instagram_url: instagramUrl, type: 'instagram_post' });
    setInstagramUrl('');
    setIsAddWorkOpen(false);
    toast({ title: 'Submitted!', description: 'Pending admin approval' });
  };

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !memberId) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    setUploadingPortrait(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `portraits/${memberId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setPortraitPreview(data.publicUrl);
      await submitChange('portrait', { portrait_path: path, portrait_url: data.publicUrl });
      toast({ title: 'Portrait Submitted!', description: 'Pending admin approval.' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleDeleteWork = (workId: string) => {
    submitChange('media_remove', { work_id: workId });
  };

  // Reorder a work directly — no approval needed for ordering
  const handleReorderWork = async (workId: string, direction: 'up' | 'down') => {
    if (!works) return;
    const idx = works.findIndex((w: any) => w.id === workId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= works.length) return;

    setReordering(true);
    try {
      await Promise.all([
        supabase.from('member_works').update({ display_order: works[swapIdx].display_order }).eq('id', works[idx].id),
        supabase.from('member_works').update({ display_order: works[idx].display_order }).eq('id', works[swapIdx].id),
      ]);
      queryClient.invalidateQueries({ queryKey: ['member-works-dashboard', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-works', memberId] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setReordering(false);
    }
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="flex items-center gap-1 text-xs text-green-500"><Check size={12} /> Approved</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-xs text-destructive"><X size={12} /> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-xs text-yellow-500"><Clock size={12} /> Pending review</span>;
    }
  };

  // Human-readable summary of what changed
  const describeChange = (pc: any) => {
    const d = pc.change_data as Record<string, any>;
    switch (pc.change_type) {
      case 'bio': return `Profile update: name, bio${d.instagram_url ? ', Instagram' : ''}${d.website_url ? ', website' : ''}`;
      case 'portrait': return 'New profile photo';
      case 'roles': return 'Creative roles update';
      case 'media_add': return d.instagram_url ? `Instagram post: ${d.instagram_url}` : `New ${d.type || 'media'} upload`;
      case 'media_remove': return 'Portfolio item removal';
      default: return pc.change_type.replace('_', ' ');
    }
  };

  const pendingCount = pendingChanges?.filter(p => p.status === 'pending').length || 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-foreground text-2xl tracking-wider">Welcome, {member?.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your profile and portfolio</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        </div>

        {isLocked && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">
              Your profile is currently locked by an admin. You cannot make changes.
            </AlertDescription>
          </Alert>
        )}

        {isHidden && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              Your profile is currently hidden from the public main page. An admin will make it visible once your account is fully set up.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio ({works?.length || 0}/6)</TabsTrigger>
            <TabsTrigger value="pending">
              Changes {pendingCount > 0 && <span className="ml-1 text-yellow-500">({pendingCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-foreground">Edit Profile</CardTitle>
                <CardDescription className="text-muted-foreground">Update your name, bio, and social links. Changes require admin approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {portraitPreview || member?.portrait_url ? (
                        <img src={portraitPreview || member?.portrait_url} alt="Portrait" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="portrait-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border bg-background text-foreground transition-colors ${isLocked || uploadingPortrait ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}>
                        <Upload size={14} /> {uploadingPortrait ? 'Uploading...' : 'Upload Photo'}
                      </label>
                      <input id="portrait-upload" type="file" accept="image/*" onChange={handlePortraitUpload} disabled={isLocked || uploadingPortrait} className="hidden" />
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WEBP. Requires admin approval.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLocked} className="bg-background border-border text-foreground" placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={isLocked} className="bg-background border-border text-foreground min-h-[100px]" placeholder="Tell us about yourself..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Instagram</label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} disabled={isLocked} className="bg-background border-border text-foreground" placeholder="https://instagram.com/username" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Website</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={isLocked} className="bg-background border-border text-foreground" placeholder="https://yourwebsite.com" />
                </div>
                <Button onClick={handleSaveProfile} disabled={isLocked} className="w-full bg-primary hover:bg-primary/90">Submit Profile Changes</Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-foreground">Creative Roles</CardTitle>
                <CardDescription className="text-muted-foreground">Select the roles that best describe your work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableRoles?.map((r: any) => (
                    <div key={r.id} className="flex items-center space-x-2">
                      <Checkbox id={r.id} checked={selectedRoles.includes(r.id)} onCheckedChange={(checked) => {
                        if (checked) setSelectedRoles([...selectedRoles, r.id]);
                        else setSelectedRoles(selectedRoles.filter(id => id !== r.id));
                      }} disabled={isLocked} />
                      <label htmlFor={r.id} className="text-sm text-foreground cursor-pointer">{r.name}</label>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveRoles} disabled={isLocked} className="w-full mt-4 bg-primary hover:bg-primary/90">Submit Role Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PORTFOLIO TAB */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-foreground">Portfolio</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {works?.length || 0} of 6 slots used. Use the arrows to reorder — no approval needed.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddWorkOpen(true)} disabled={isLocked || (works?.length || 0) >= 6} className="bg-primary hover:bg-primary/90">
                    <Upload size={16} className="mr-2" /> Add Work
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {works?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    <p>No portfolio items yet. Add your first work!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {works?.map((work: any, i: number) => (
                      <div key={work.id} className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg p-3">

                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {work.storage_path ? (
                            <img
                              src={supabase.storage.from('media').getPublicUrl(work.storage_path).data.publicUrl}
                              alt="Portfolio item"
                              className="w-full h-full object-cover"
                            />
                          ) : work.instagram_url ? (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                              <Instagram className="h-6 w-6 text-white" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={20} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium capitalize">{work.type}</p>
                          {work.instagram_url && (
                            <p className="text-muted-foreground text-xs truncate">{work.instagram_url}</p>
                          )}
                          <p className="text-muted-foreground text-xs">Slot {i + 1}</p>
                        </div>

                        {/* Reorder arrows */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReorderWork(work.id, 'up')}
                            disabled={i === 0 || reordering || !!isLocked}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-1"
                            title="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => handleReorderWork(work.id, 'down')}
                            disabled={i === (works.length - 1) || reordering || !!isLocked}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-1"
                            title="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteWork(work.id)}
                          disabled={!!isLocked}
                          className="text-destructive hover:text-destructive/80 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Remove (requires approval)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Empty slot indicators */}
                    {Array.from({ length: 6 - (works?.length || 0) }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex items-center gap-3 border border-dashed border-border rounded-lg p-3 opacity-30">
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">Empty slot {(works?.length || 0) + i + 1}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDING CHANGES TAB */}
          <TabsContent value="pending" className="space-y-3">
            {(!pendingChanges || pendingChanges.length === 0) ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Check className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p>No changes submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Pending first, then rest by date */}
                {[...pendingChanges]
                  .sort((a, b) => {
                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                    if (a.status !== 'pending' && b.status === 'pending') return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((pc: any) => (
                    <Card key={pc.id} className={`bg-card border ${pc.status === 'rejected' ? 'border-destructive/30' : pc.status === 'approved' ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{describeChange(pc)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Submitted {new Date(pc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {getStatusBadge(pc.status)}
                        </div>

                        {/* Show admin note if rejected */}
                        {pc.status === 'rejected' && pc.admin_note && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mt-2">
                            <p className="text-xs text-destructive font-medium mb-0.5">Admin note</p>
                            <p className="text-xs text-foreground">{pc.admin_note}</p>
                          </div>
                        )}

                        {/* Portrait preview */}
                        {pc.change_type === 'portrait' && pc.change_data?.portrait_url && (
                          <img src={pc.change_data.portrait_url} alt="Portrait" className="w-16 h-16 rounded-full object-cover mt-2" />
                        )}

                        {/* Instagram URL */}
                        {pc.change_type === 'media_add' && pc.change_data?.instagram_url && (
                          <a href={pc.change_data.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 block truncate">
                            {pc.change_data.instagram_url}
                          </a>
                        )}

                        {/* Uploaded image preview */}
                        {pc.change_type === 'media_add' && pc.change_data?.storage_path && (
                          <img
                            src={supabase.storage.from('media').getPublicUrl(pc.change_data.storage_path).data.publicUrl}
                            alt="Uploaded media"
                            className="w-20 h-20 object-cover rounded mt-2"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </>
            )}
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <div className="flex flex-col gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-heading text-foreground text-base tracking-wider">Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2"><TrendingUp size={16} /><span className="text-sm">Profile Views</span></div>
                      <p className="text-3xl font-bold text-foreground">{analytics?.last30?.views || 0}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2"><MousePointerClick size={16} /><span className="text-sm">Link Clicks</span></div>
                      <p className="text-3xl font-bold text-foreground">{analytics?.last30?.clicks || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-heading text-foreground text-base tracking-wider">Last 365 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2"><TrendingUp size={16} /><span className="text-sm">Profile Views</span></div>
                      <p className="text-3xl font-bold text-foreground">{analytics?.last365?.views || 0}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2"><MousePointerClick size={16} /><span className="text-sm">Link Clicks</span></div>
                      <p className="text-3xl font-bold text-foreground">{analytics?.last365?.clicks || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Work Dialog */}
        <Dialog open={isAddWorkOpen} onOpenChange={setIsAddWorkOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">Add Portfolio Item</DialogTitle>
              <DialogDescription className="text-muted-foreground">Choose to upload a file or embed an Instagram post</DialogDescription>
            </DialogHeader>
            <Tabs value={workUploadType} onValueChange={(v: any) => setWorkUploadType(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="instagram">Instagram Post</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploadingFile || !!isLocked} className="bg-background border-border" />
                  <p className="text-xs text-muted-foreground mt-2">Upload an image or video (max 10MB)</p>
                </div>
              </TabsContent>
              <TabsContent value="instagram" className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Instagram Post URL</label>
                  <Input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://www.instagram.com/p/ABC123/" className="bg-background border-border text-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">Paste the URL of an Instagram post to embed it</p>
                </div>
                <Button onClick={handleInstagramSubmit} disabled={!!isLocked} className="w-full bg-primary hover:bg-primary/90">
                  <Instagram size={16} className="mr-2" /> Add Instagram Post
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default MemberDashboard;
