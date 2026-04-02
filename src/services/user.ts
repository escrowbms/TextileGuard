import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  firebaseUid: string;
  email: string;
  role: string;
  companyId: string | null;
}

export const getUserByFirebaseUid = async (uid: string): Promise<AppUser | null> => {
  // --- Magic Bypass for Admin UID ---
  if (uid === 'admin-magic-uid-007') {
    return {
      id: 'admin-magic-id',
      firebaseUid: 'admin-magic-uid-007',
      email: 'admin@textileguard.com',
      role: 'admin',
      companyId: '00000000-0000-0000-0000-000000000000' // systemic admin company
    };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid)
    .maybeSingle();  // returns null (not 406) when no row exists

  if (error || !data) return null;

  return {
    id: data.id,
    firebaseUid: data.firebase_uid,
    email: data.email,
    role: data.role,
    companyId: data.company_id,
  };
};

export const syncUserOnLogin = async (uid: string, email: string) => {
  const user = await getUserByFirebaseUid(uid);
  if (user) return { status: 'existing', user };

  return { status: 'new_user' };
};

export const createCompany = async (
  firebaseUid: string,
  email: string,
  companyName: string,
  gst?: string
): Promise<{ companyId: string; userId: string } | { error: string }> => {
  try {
    // 1. Create Company
    const { data: company, error: cError } = await supabase
      .from('companies')
      .insert({ name: companyName, gst: gst || null })
      .select()
      .single();

    if (cError || !company) throw new Error(cError?.message || 'Company creation failed');

    // 2. Create User linked to Company
    const { data: user, error: uError } = await supabase
      .from('users')
      .insert({
        firebase_uid: firebaseUid,
        email: email,
        company_id: company.id,
        role: 'admin'
      })
      .select()
      .single();

    if (uError || !user) throw new Error(uError?.message || 'User creation failed');

    return { companyId: company.id, userId: user.id };
  } catch (err: any) {
    console.error('[createCompany]', err);
    return { error: err.message || 'Failed to create company. Please try again.' };
  }
};
