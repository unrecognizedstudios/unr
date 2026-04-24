import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';

type Mode = 'loading' | 'set_password' | 'error' | 'success';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type'); // 'recovery' or 'invite'

    if (tokenHash && (type === 'recovery' || type === 'invite')) {
      // Exchange the token_hash for a live session.
      // This is required when using the new {{ .TokenHash }} email templates.
      supabase.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: type === 'invite' ? 'invite' : 'recovery',
        })
        .then(({ error: otpError }) => {
          if (otpError) {
            console.error('Token verification failed:', otpError);
            setMode('error');
          } else {
            // Session established — show the password form
            setMode('set_password');
          }
        });
    } else {
      // Fallback for old-style hash fragment tokens (#access_token=...)
      // Supabase JS picks these up automatically via onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setMode('set_password');
        }
      });

      // No token found after a short wait -> show error
      const timer = setTimeout(() => {
        setMode((current) => (current === 'loading' ? 'error' : current));
      }, 3000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    }
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setMode('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {mode === 'loading' && (
            <p className="text-muted-foreground text-center tracking-widest text-sm animate-pulse">
              Verifying link...
            </p>
          )}

          {mode === 'set_password' && (
            <>
              <h1 className="font-heading text-foreground text-3xl tracking-wider text-center mb-2">
                Set Password
              </h1>
              <p className="text-muted-foreground text-xs text-center mb-8">
                Choose a password for your account.
              </p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-heading tracking-widest"
                >
                  {loading ? '...' : 'Save Password'}
                </Button>
              </form>
            </>
          )}

          {mode === 'success' && (
            <div className="text-center space-y-3">
              <h1 className="font-heading text-foreground text-3xl tracking-wider">
                All Set
              </h1>
              <p className="text-muted-foreground text-sm">
                Your password has been saved. Redirecting to your dashboard...
              </p>
            </div>
          )}

          {mode === 'error' && (
            <div className="text-center space-y-4">
              <h1 className="font-heading text-foreground text-3xl tracking-wider">
                Link Expired
              </h1>
              <p className="text-muted-foreground text-sm">
                This link is invalid or has expired. Please contact an admin for a new invite.
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="font-heading tracking-widest"
              >
                Back to Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default AuthCallback;
