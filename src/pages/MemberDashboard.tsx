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
import { LogOut, Upload, Check, Clock, X, TrendingUp, MousePointerClick } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MemberDashboard = () => {
  const { user, role, memberId, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use consolidated queries hook
  const {
    member,
    availableRoles,
    memberRoles,
    pendingChanges,
    works,
    analytics,
    isLoading: memberLoading,
  } = useMemberDashboard(memberId);

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
  };

  const handleSaveRoles = () => {
    submitChange('roles', { role_ids: selectedRoles });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !memberId) return;
    const file = e.target.files[0];
    const currentCount = works?.length || 0;
    
    if (currentCount >= 6) {
      toast({ 
        title: 'Limit Reached', 
        description: 'You can only upload up to 6 works.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const ext = file.name.split('.').pop();
      const path = `${memberId}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      
      if (uploadError) throw uploadError;

      const type = file.type.startsWith('video') ? 'video' : 'image';
      await submitChange('media_add', { storage_path: path, type });
    } catch (err: any) {
      toast({ 
        title: 'Upload Failed', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
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
            <Check size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <X size={12} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
            <Clock size={12} />
            Pending
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
              Manage your profile and view analytics
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
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Your editing access has been temporarily disabled by an administrator. Please contact an admin for more information.
            </AlertDescription>
          </Alert>
        )}

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
      </div>
    </PageTransition>
  );
};

export default MemberDashboard;
