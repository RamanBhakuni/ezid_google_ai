

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { createUserProfile, getUserProfile, syncEmailVerification, addRoleToUser } from './db';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string) => {
    try {
        const profile = await getUserProfile(uid);
        if (profile) {
            setUser(profile);
        } else {
            // Fallback for zombies
            setUser({ 
                id: uid, 
                email: email, 
                name: 'User', 
                role: UserRole.INDIVIDUAL,
                roles: [UserRole.INDIVIDUAL],
                quotaUsed: 0,
                lookupBalance: 0,
                isVerified: false
            });
        }
    } catch (e) {
        console.error("Error fetching user profile:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsEmailVerified(fbUser.emailVerified);
        await fetchProfile(fbUser.uid, fbUser.email!);
      } else {
        setUser(null);
        setIsEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
      if (firebaseUser) {
          await fetchProfile(firebaseUser.uid, firebaseUser.email!);
      }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    if (auth.currentUser) {
        await auth.currentUser.reload();
        const verified = auth.currentUser.emailVerified;
        setIsEmailVerified(verified);
        
        if (verified) {
             // Sync with DB
             await syncEmailVerification(auth.currentUser.uid);
             await refreshUserProfile();
        }
        return verified;
    }
    return false;
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const login = async (email: string, password: string) => {
    try {
        console.log("Attempting login for:", email);
        await signInWithEmailAndPassword(auth, email, password); 
        console.log("Login successful");
    } catch (error: any) {
        console.error("Login failed", error);
        throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    console.log("--- REGISTRATION START ---");
    console.log("Step 1: Creating Auth User...", { email, role });
    
    try {
      // 1. Create Auth User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      console.log("Step 1 SUCCESS: Auth User Created", fbUser.uid);

      // 2. Prepare User Object
      const newUser: User = {
        id: fbUser.uid,
        email: email,
        name: name,
        role: role,
        roles: [role], // Initialize with single role
        plan: 'FREE', // ALWAYS Default to FREE, regardless of role
        shortId: null, // No auto-gen
        organizationName: role === UserRole.BUSINESS ? name : null,
        quotaUsed: 0,
        lookupBalance: 10,
        isVerified: false,
        aliasCredits: 0
      };

      console.log("Step 2: Preparing DB Profile", newUser);

      // 3. Create Firestore Profile
      console.log("Step 3: Writing to Firestore...");
      await createUserProfile(newUser);
      console.log("Step 3 SUCCESS: Firestore Write Complete");
      
      // 4. Send Verification Email
      console.log("Step 4: Sending Verification Email...");
      await sendEmailVerification(fbUser);

      // 5. Update Local State (but verification is false initially)
      setFirebaseUser(fbUser);
      setIsEmailVerified(false);
      setUser(newUser);
      
      console.log("--- REGISTRATION COMPLETE ---");
    } catch (error: any) {
      console.error("REGISTRATION ERROR:", error);

      // --- HANDLE ACCOUNT UPGRADE (Unified Identity) ---
      if (error.code === 'auth/email-already-in-use') {
          console.log("Email in use. Attempting login-and-upgrade flow.");
          try {
              // Try to sign in with provided password
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              const fbUser = userCredential.user;
              
              // If successful, we fetch current profile
              const existingProfile = await getUserProfile(fbUser.uid);
              
              if (existingProfile) {
                  // Check if they already have the requested role
                  if (!existingProfile.roles.includes(role)) {
                      console.log(`Upgrading user ${existingProfile.id} with new role: ${role}`);
                      await addRoleToUser(existingProfile.id, role);
                      
                      // Refresh profile locally
                      await refreshUserProfile();
                      console.log("Account upgrade successful.");
                      return; // Success! Return to exit function
                  } else {
                      // They already have this role, just log them in
                      console.log("User already has this role. Logged in.");
                      return;
                  }
              }
          } catch (loginErr) {
              // If login fails (wrong password), throw original 'email-in-use' error
              // so the UI tells them to login or check password
              console.error("Login-during-register failed:", loginErr);
              throw error; 
          }
      }

      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("Attempting password reset for:", email);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setIsEmailVerified(false);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        firebaseUser,
        isEmailVerified,
        login, 
        register, 
        resetPassword, 
        logout, 
        refreshUserProfile, 
        checkVerificationStatus,
        resendVerificationEmail, 
        loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
