import { getSupabase } from '../db/supabase';
import { AuthenticatedUser } from '../types';
import { DecodedIdToken } from 'firebase-admin/auth';

export class UserService {
  static async syncFirebaseUser(
    decodedToken: DecodedIdToken,
    extraData?: { displayName?: string; photoUrl?: string; phoneNumber?: string }
  ): Promise<AuthenticatedUser> {
    const supabase = getSupabase();
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || `${firebaseUid}@somigo.firebase`;
    const fullName =
      extraData?.displayName ||
      decodedToken.name ||
      (email ? email.split('@')[0] : 'SomiGo Customer');
    const profileImageUrl = extraData?.photoUrl || decodedToken.picture || null;
    const phoneNumber = extraData?.phoneNumber || decodedToken.phone_number || null;

    // 1. Query Supabase for existing user by firebase_uid
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (findError) {
      console.error('Supabase query error searching user by firebase_uid:', findError);
      throw new Error(`Database error looking up user: ${findError.message}`);
    }

    if (existingUser) {
      // 2. Update user profile details if they changed
      const updatePayload: Record<string, any> = {
        last_login_at: new Date().toISOString(),
      };
      if (fullName && (!existingUser.full_name || existingUser.full_name.startsWith('User '))) {
        updatePayload.full_name = fullName;
      }
      if (profileImageUrl && !existingUser.profile_image_url) {
        updatePayload.profile_image_url = profileImageUrl;
      }
      if (phoneNumber && !existingUser.phone_number) {
        updatePayload.phone_number = phoneNumber;
      }

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.warn('Warning updating user in Supabase:', updateError.message);
      }

      // Also ensure profiles table record exists
      await supabase.from('profiles').upsert(
        {
          user_id: existingUser.id,
          firebase_uid: firebaseUid,
          email: existingUser.email,
          display_name: fullName,
          photo_url: profileImageUrl || existingUser.profile_image_url,
          phone: phoneNumber || existingUser.phone_number,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      );

      const u = updated || existingUser;
      return {
        id: u.id,
        firebaseUid: u.firebase_uid,
        email: u.email,
        fullName: u.full_name,
        phoneNumber: u.phone_number,
        profileImageUrl: u.profile_image_url,
        role: u.role || 'CUSTOMER',
        accountStatus: u.account_status || 'ACTIVE',
      };
    }

    // 3. User does not exist: Create new user in Supabase
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        firebase_uid: firebaseUid,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        profile_image_url: profileImageUrl,
        role: 'CUSTOMER',
        account_status: 'ACTIVE',
        email_verified: Boolean(decodedToken.email_verified),
        phone_verified: Boolean(phoneNumber),
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error inserting new user:', createError);
      throw new Error(`Failed to create application user: ${createError.message}`);
    }

    // Also insert into profiles table
    await supabase.from('profiles').insert({
      user_id: newUser.id,
      firebase_uid: firebaseUid,
      email: newUser.email,
      display_name: fullName,
      photo_url: profileImageUrl,
      phone: phoneNumber,
    });

    return {
      id: newUser.id,
      firebaseUid: newUser.firebase_uid,
      email: newUser.email,
      fullName: newUser.full_name,
      phoneNumber: newUser.phone_number,
      profileImageUrl: newUser.profile_image_url,
      role: newUser.role,
      accountStatus: newUser.account_status,
    };
  }

  static async getUserByFirebaseUid(firebaseUid: string): Promise<AuthenticatedUser | null> {
    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      profileImageUrl: user.profile_image_url,
      role: user.role,
      accountStatus: user.account_status,
    };
  }
}
