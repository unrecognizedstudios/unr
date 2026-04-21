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
<<<<<<< HEAD
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Upload, Check, Clock, X, TrendingUp, MousePointerClick, Trash2, GripVertical, Image as ImageIcon, Link as LinkIcon, Instagram } from 'lucide-react';
=======
import { LogOut, Upload, Check, Clock, X, TrendingUp, MousePointerClick } from 'lucide-react';
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MemberDashboard = () => {
  const { user, role, memberId, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

<<<<<<< HEAD
=======
  // Use consolidated queries hook
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
  const {
    member,
    availableRoles,
    memberRoles,
    pendingChanges,
    works,
    analytics,
    isLoading: memberLoading,
  } = useMemberDashboard(memberId);

<<<<<<< HEAD
  // Profile edit state
  const [name, setName] = useState('');
=======
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

<<<<<<< HEAD
  // Portfolio management state
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [workUploadType, setWorkUploadType] = useState<'upload' | 'instagram'>('upload');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
=======
  useEffect(() => {
    if (member) {
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
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
    
    try {
      const { error } = await supabase.from('pending_changes').insert({
        member_id: memberId,
        change_type: changeType,
        change_data: changeData,
      });
      
      if (error) throw error;

      toast({ 
        title: 'Submitted for Approval', 
        description: 'Your changes will be reviewed by an admin.' 
      });
      
      queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
  };

<<<<<<< HEAD
  // Save profile changes (name, bio, links)
  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    if (!bio.trim()) {
      toast({ title: 'Error', description: 'Bio cannot be empty', variant: 'destructive' });
      return;
    }
    
    submitChange('bio', { 
      name,
      bio, 
      instagram_url: instagram, 
      website_url: website 
    });
=======
  const handleSaveBio = () => {
    if (!bio.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Bio cannot be empty', 
        variant: 'destructive' 
      });
      return;
    }
    submitChange('bio', { bio });
  };

  const handleSaveLinks = () => {
    submitChange('links', { instagram_url: instagram, website_url: website });
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
  };

  const handleSaveRoles = () => {
    submitChange('roles', { role_ids: selectedRoles });
  };

<<<<<<< HEAD
  // File upload for portfolio
=======
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !memberId) return;
    const file = e.target.files[0];
    const currentCount = works?.length || 0;
    
    if (currentCount >= 6) {
      toast({ 
        title: 'Limit Reached', 
<<<<<<< HEAD
        description: 'You can only have up to 6 portfolio items.', 
=======
        description: 'You can only upload up to 6 works.', 
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
        variant: 'destructive' 
      });
      return;
    }

<<<<<<< HEAD
    setUploadingFile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `works/${memberId}/${Date.now()}.${ext}`;
=======
    try {
      const ext = file.name.split('.').pop();
      const path = `${memberId}/${Date.now()}.${ext}`;
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
      
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      
      if (uploadError) throw uploadError;

      const type = file.type.startsWith('video') ? 'video' : 'image';
      await submitChange('media_add', { storage_path: path, type });
<<<<<<< HEAD
      
      setIsAddWorkOpen(false);
      toast({ title: 'Uploaded!', description: 'Pending admin approval' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  // Instagram URL submission
  const handleInstagramSubmit = () => {
    const currentCount = works?.length || 0;
    
    if (currentCount >= 6) {
      toast({ 
        title: 'Limit Reached', 
        description: 'You can only have up to 6 portfolio items.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!instagramUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter an Instagram URL', variant: 'destructive' });
      return;
    }

    // Basic Instagram URL validation
    if (!instagramUrl.includes('instagram.com')) {
      toast({ 
        title: 'Invalid URL', 
        description: 'Please enter a valid Instagram post URL', 
        variant: 'destructive' 
      });
      return;
    }

    submitChange('media_add', { 
      instagram_url: instagramUrl, 
      type: 'instagram_post' 
    });
    
    setInstagramUrl('');
    setIsAddWorkOpen(false);
    toast({ title: 'Submitted!', description: 'Pending admin approval' });
  };

  // Delete portfolio item
  const handleDeleteWork = (workId: string) => {
    submitChange('media_remove', { work_id: workId });
=======
    } catch (err: any) {
      toast({ 
        title: 'Upload Failed', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-xs text-green-500">
<<<<<<< HEAD
            <Check size={12} /> Approved
=======
            <Check size={12} />
            Approved
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs text-destructive">
<<<<<<< HEAD
            <X size={12} /> Rejected
=======
            <X size={12} />
            Rejected
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
<<<<<<< HEAD
            <Clock size={12} /> Pending
=======
            <Clock size={12} />
            Pending
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
          </span>
        );
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-foreground text-2xl tracking-wider">
              Welcome, {member?.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
<<<<<<< HEAD
              Manage your profile and portfolio
=======
              Manage your profile and view analytics
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>

        {/* Locked Warning */}
        {isLocked && (
<<<<<<< HEAD
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">
              Your profile is currently locked by an admin. You cannot make changes.
=======
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Your editing access has been temporarily disabled by an administrator. Please contact an admin for more information.
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
            </AlertDescription>
          </Alert>
        )}

<<<<<<< HEAD
        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio ({works?.length || 0}/6)</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingChanges?.filter(p => p.status === 'pending').length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-foreground">Edit Profile</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your name, bio, and social links. Changes require admin approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLocked}
                    className="bg-background border-border text-foreground"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={isLocked}
                    className="bg-background border-border text-foreground min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Instagram</label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    disabled={isLocked}
                    className="bg-background border-border text-foreground"
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Website</label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={isLocked}
                    className="bg-background border-border text-foreground"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isLocked}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Submit Profile Changes
                </Button>
              </CardContent>
            </Card>

            {/* Creative Roles */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-foreground">Creative Roles</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Select the roles that best describe your work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableRoles?.map((r: any) => (
                    <div key={r.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={r.id}
                        checked={selectedRoles.includes(r.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles([...selectedRoles, r.id]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(id => id !== r.id));
                          }
                        }}
                        disabled={isLocked}
                      />
                      <label
                        htmlFor={r.id}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {r.name}
                      </label>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleSaveRoles} 
                  disabled={isLocked}
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                >
                  Submit Role Changes
                </Button>
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
                      Upload images/videos or embed Instagram posts (max 6 items)
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsAddWorkOpen(true)}
                    disabled={isLocked || (works?.length || 0) >= 6}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Upload size={16} className="mr-2" />
                    Add Work
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
                  <div className="grid grid-cols-2 gap-4">
                    {works?.map((work: any) => (
                      <div 
                        key={work.id}
                        className="relative group bg-muted rounded-lg overflow-hidden aspect-square"
                      >
                        {work.storage_path && (
                          <img 
                            src={`${supabase.storage.from('media').getPublicUrl(work.storage_path).data.publicUrl}`}
                            alt="Portfolio item"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {work.instagram_url && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <Instagram className="h-12 w-12 text-white" />
                            <p className="absolute bottom-2 left-2 right-2 text-white text-xs truncate">
                              {work.instagram_url}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWork(work.id)}
                            disabled={isLocked}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDING CHANGES TAB */}
          <TabsContent value="pending" className="space-y-3">
            {pendingChanges?.filter(p => p.status === 'pending').length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Check className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p>No pending changes</p>
                </CardContent>
              </Card>
            ) : (
              pendingChanges?.map((pc: any) => (
                <Card key={pc.id} className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {pc.change_type.replace('_', ' ')}
                      </span>
                      {getStatusBadge(pc.status)}
                    </div>
                    <pre className="text-xs text-muted-foreground bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(pc.change_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading text-foreground">Your Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp size={16} />
                      <span className="text-sm">Profile Views</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.views || 0}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MousePointerClick size={16} />
                      <span className="text-sm">Link Clicks</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.clicks || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Work Dialog */}
        <Dialog open={isAddWorkOpen} onOpenChange={setIsAddWorkOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">Add Portfolio Item</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Choose to upload a file or embed an Instagram post
              </DialogDescription>
            </DialogHeader>

            <Tabs value={workUploadType} onValueChange={(v: any) => setWorkUploadType(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="instagram">Instagram Post</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploadingFile || isLocked}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload an image or video (max 10MB)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="instagram" className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Instagram Post URL
                  </label>
                  <Input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/ABC123/"
                    className="bg-background border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Paste the URL of an Instagram post to embed it
                  </p>
                </div>
                <Button 
                  onClick={handleInstagramSubmit}
                  disabled={isLocked}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Instagram size={16} className="mr-2" />
                  Add Instagram Post
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
=======
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profile Views
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics?.views || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total profile page visits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Link Clicks
              </CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics?.clicks || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Instagram & website clicks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Bio Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biography</CardTitle>
            <CardDescription>
              Update your bio to tell visitors about yourself
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLocked}
              placeholder="Write something about yourself..."
              className="bg-card border-border text-foreground min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </p>
              <Button 
                onClick={handleSaveBio} 
                disabled={isLocked || !bio.trim()} 
                size="sm" 
                className="bg-primary text-primary-foreground"
              >
                Submit Bio Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Links Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Add your Instagram and website links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Instagram URL</label>
              <Input
                placeholder="https://instagram.com/yourusername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={isLocked}
                className="bg-card border-border text-foreground"
                type="url"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Website URL</label>
              <Input
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={isLocked}
                className="bg-card border-border text-foreground"
                type="url"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveLinks} 
                disabled={isLocked} 
                size="sm" 
                className="bg-primary text-primary-foreground"
              >
                Submit Link Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Roles Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Roles</CardTitle>
            <CardDescription>
              Select the roles that describe what you do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableRoles && availableRoles.length > 0 ? (
              <div className="space-y-3">
                {availableRoles.map((r) => (
                  <label 
                    key={r.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(r.id)}
                      onCheckedChange={(checked) => {
                        setSelectedRoles((prev) =>
                          checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                        );
                      }}
                      disabled={isLocked}
                    />
                    <span className="text-foreground font-medium">{r.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No roles available yet. Contact an admin to add roles.
              </p>
            )}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveRoles} 
                disabled={isLocked || !availableRoles?.length} 
                size="sm" 
                className="bg-primary text-primary-foreground"
              >
                Submit Role Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Media Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Portfolio Works ({works?.length || 0}/6)</CardTitle>
            <CardDescription>
              Upload images or videos to showcase your work (max 6)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLocked && (works?.length || 0) < 6 ? (
              <label className="block cursor-pointer group">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors group-hover:bg-muted/30">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                  <p className="text-foreground font-medium mb-1">
                    Click to upload image or video
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Supported formats: JPG, PNG, GIF, MP4, MOV
                  </p>
                </div>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleMediaUpload} 
                />
              </label>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isLocked ? (
                  <p>Upload disabled - editing is locked</p>
                ) : (
                  <p>Maximum of 6 works reached</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Track the status of your change requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingChanges && pendingChanges.length > 0 ? (
              <div className="space-y-3">
                {pendingChanges.map((pc) => (
                  <div 
                    key={pc.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-foreground font-medium capitalize">
                        {pc.change_type.replace('_', ' ')}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Submitted {new Date(pc.created_at).toLocaleDateString()} at{' '}
                        {new Date(pc.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(pc.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No submissions yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Changes you submit will appear here for admin review
                </p>
              </div>
            )}
          </CardContent>
        </Card>
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
      </div>
    </PageTransition>
  );
};

<<<<<<< HEAD
export default MemberDashboard;
=======
export default MemberDashboard;
>>>>>>> 56ba229ab5dc27944df95645eb897d9abe944e3e
