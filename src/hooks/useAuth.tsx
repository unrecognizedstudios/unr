import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'member';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  memberId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndMember = async (userId: string) => {
    try {
      console.log('🔍 Fetching role for user:', userId);
      
      // Add timeout to prevent hanging forever
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      );
      
      const roleQuery = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const memberQuery = supabase
        .from('members')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      // Race the queries against timeout
      const [roleRes, memberRes] = await Promise.race([
        Promise.all([roleQuery, memberQuery]),
        timeout
      ]) as any;
      
      // 🐛 Log the results
      console.log('📊 Role query result:', roleRes);
      console.log('📊 Member query result:', memberRes);
      
      // Check for errors
      if (roleRes.error) {
        console.error('❌ Error fetching role:', roleRes.error);
        console.error('❌ Error details:', JSON.stringify(roleRes.error, null, 2));
      }
      if (memberRes.error) {
        console.error('❌ Error fetching member:', memberRes.error);
        console.error('❌ Error details:', JSON.stringify(memberRes.error, null, 2));
      }
      
      const fetchedRole = (roleRes.data?.role as AppRole) || null;
      const fetchedMemberId = memberRes.data?.id || null;
      
      console.log('✅ Setting role to:', fetchedRole);
      console.log('✅ Setting memberId to:', fetchedMemberId);
      
      setRole(fetchedRole);
      setMemberId(fetchedMemberId);
    } catch (error) {
      console.error('💥 Exception in fetchRoleAndMember:', error);
      console.error('💥 This usually means:');
      console.error('   1. RLS policies are blocking the query');
      console.error('   2. The user_roles or members table does not exist');
      console.error('   3. Network connection issue');
      console.error('   4. Query took longer than 5 seconds (timeout)');
      
      // Set role to null so app can continue
      setRole(null);
      setMemberId(null);
    }
  };

  useEffect(() => {
    console.log('🚀 useAuth: Setting up auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 Auth state changed:', _event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoleAndMember(session.user.id);
        } else {
          setRole(null);
          setMemberId(null);
        }
        setLoading(false);
        console.log('✅ Auth state change complete, loading=false');
      }
    );

    // Initial session check
    (async () => {
      console.log('🔍 Initial session check...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
      }
      
      console.log('📋 Initial session:', session?.user?.email || 'none');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchRoleAndMember(session.user.id);
      }
      
      setLoading(false);
      console.log('✅ Initial auth check complete, loading=false');
    })();

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setMemberId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, memberId, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
