import { supabase, isSupabaseConfigured } from './supabaseClient';

const CURRENT_USER_STORAGE = 'wedora_current_user';
const ADMIN_CREDENTIALS = {
  username: 'Pramod',
  email: 'admin@wedora.lk',
  password: 'Pramod@2026'
};

export const authService = {
  async getCurrentUser() {
    if (isSupabaseConfigured) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        status: profile.status
      };
    }

    // Demo Mode: read persisted session from localStorage
    try {
      const stored = localStorage.getItem(CURRENT_USER_STORAGE);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.role = 'admin'; // Always ensure admin
        parsed.full_name = parsed.full_name || 'Pramod';
        return parsed;
      }
      // Default to Pramod (Admin)
      const defaultAdmin = {
        id: 'emp-001',
        full_name: 'Pramod',
        email: 'admin@wedora.lk',
        phone: '+94 78 359 0222',
        role: 'admin',
        status: 'active'
      };
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(defaultAdmin));
      return defaultAdmin;
    } catch (e) {
      return {
        id: 'emp-001',
        full_name: 'Pramod',
        email: 'admin@wedora.lk',
        phone: '+94 78 359 0222',
        role: 'admin',
        status: 'active'
      };
    }
  },

  async login(loginIdentifier, password) {
    const trimmedId = (loginIdentifier || '').trim();

    if (isSupabaseConfigured) {
      if (!trimmedId.includes('@')) {
        throw new Error('Enter the email address registered for your Supabase account.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedId,
        password
      });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Your account has no Wedora profile. Ask an administrator to activate it.');
      }
      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('Your Wedora account is inactive. Contact an administrator.');
      }

      const user = {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        status: profile.status
      };

      return user;
    }

    // Demo Mode login validation
    const isValidUsernameOrEmail =
      trimmedId.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() ||
      trimmedId.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();

    const isValidPassword =
      password === ADMIN_CREDENTIALS.password ||
      password === 'wedora123'; // legacy fallback

    if (!isValidUsernameOrEmail) {
      throw new Error(`Invalid Admin username or email. Please enter '${ADMIN_CREDENTIALS.username}'.`);
    }

    if (!isValidPassword) {
      throw new Error("Invalid password. Please check your credentials.");
    }

    const targetUser = {
      id: 'emp-001',
      full_name: 'Pramod',
      email: trimmedId.includes('@') ? trimmedId : ADMIN_CREDENTIALS.email,
      phone: '+94 78 359 0222',
      role: 'admin',
      status: 'active'
    };

    localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(targetUser));
    return targetUser;
  },

  async logout() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    localStorage.removeItem(CURRENT_USER_STORAGE);
  }
};
