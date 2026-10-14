import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  isFirebaseLive 
} from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    uid: "user_a",
    email: "nguyenvana@gmail.com",
    displayName: "Nguyễn Văn A",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    bankName: "VCB",
    bankAccountNumber: "0071001234567",
    bankAccountHolder: "NGUYEN VAN A",
    role: "Creator"
  },
  {
    uid: "user_b",
    email: "tranthib@gmail.com",
    displayName: "Trần Thị B",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    bankName: "MB",
    bankAccountNumber: "0912345678",
    bankAccountHolder: "TRAN THI B",
    role: "Member"
  },
  {
    uid: "user_c",
    email: "levanc@gmail.com",
    displayName: "Lê Văn C",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander",
    bankName: "TCB",
    bankAccountNumber: "19034567890123",
    bankAccountHolder: "LE VAN C",
    role: "Member"
  },
  {
    uid: "user_d",
    email: "phamminhd@gmail.com",
    displayName: "Phạm Minh D",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    bankName: "ACB",
    bankAccountNumber: "88889999123",
    bankAccountHolder: "PHAM MINH D",
    role: "Member"
  },
  {
    uid: "user_e",
    email: "hoangthie@gmail.com",
    displayName: "Hoàng Thị E",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Molly",
    bankName: "VPB",
    bankAccountNumber: "1234567890",
    bankAccountHolder: "HOANG THI E",
    role: "Member"
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    let unsubscribe = null;

    if (isFirebaseLive && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const token = await fbUser.getIdToken();
          localStorage.setItem('splitmate_token', token);
          localStorage.setItem('splitmate_user_id', fbUser.uid);
          
          try {
            const profile = await api.get('/users/profile');
            setCurrentUser(profile);
          } catch (e) {
            setCurrentUser({
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'Người dùng SplitMate',
              email: fbUser.email,
              photoURL: fbUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + fbUser.uid,
            });
          }
        } else {
          localStorage.removeItem('splitmate_token');
          setCurrentUser(null);
        }
        setLoading(false);
      });
    } else {
      // Offline/Local demo mode
      const savedUserId = localStorage.getItem('splitmate_user_id') || 'user_a';
      const matched = DEMO_USERS.find(u => u.uid === savedUserId) || DEMO_USERS[0];
      localStorage.setItem('splitmate_user_id', matched.uid);

      api.get('/users/profile')
        .then((profile) => {
          setCurrentUser(profile || matched);
        })
        .catch(() => {
          setCurrentUser(matched);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    if (isFirebaseLive && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      localStorage.setItem('splitmate_token', token);
      localStorage.setItem('splitmate_user_id', cred.user.uid);
      const profile = await api.get('/users/profile');
      setCurrentUser(profile);
      return profile;
    } else {
      // Find matching demo user or create mock
      const matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: email.split('@')[0],
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
      };
      localStorage.setItem('splitmate_user_id', matched.uid);
      setCurrentUser(matched);
      await api.put('/users/profile', matched).catch(() => {});
      return matched;
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    if (isFirebaseLive && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(cred.user, { displayName });
      const token = await cred.user.getIdToken();
      localStorage.setItem('splitmate_token', token);
      localStorage.setItem('splitmate_user_id', cred.user.uid);
      
      const newProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + cred.user.uid
      };
      await api.put('/users/profile', newProfile);
      setCurrentUser(newProfile);
      return newProfile;
    } else {
      const newUid = `user_${Date.now()}`;
      const newUser = {
        uid: newUid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + newUid,
      };
      localStorage.setItem('splitmate_user_id', newUid);
      setCurrentUser(newUser);
      await api.put('/users/profile', newUser).catch(() => {});
      return newUser;
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseLive && auth && googleProvider) {
      const cred = await signInWithPopup(auth, googleProvider);
      const token = await cred.user.getIdToken();
      localStorage.setItem('splitmate_token', token);
      localStorage.setItem('splitmate_user_id', cred.user.uid);
      const profile = await api.get('/users/profile');
      setCurrentUser(profile);
      return profile;
    } else {
      // Demo google login
      const demoGoogle = DEMO_USERS[0];
      localStorage.setItem('splitmate_user_id', demoGoogle.uid);
      setCurrentUser(demoGoogle);
      return demoGoogle;
    }
  };

  const resetPassword = async (email) => {
    if (isFirebaseLive && auth) {
      return sendPasswordResetEmail(auth, email);
    }
    return Promise.resolve();
  };

  const logout = async () => {
    if (isFirebaseLive && auth) {
      await signOut(auth);
    }
    localStorage.removeItem('splitmate_token');
    localStorage.removeItem('splitmate_user_id');
    setCurrentUser(null);
  };

  const switchDemoUser = async (userId) => {
    localStorage.setItem('splitmate_user_id', userId);
    try {
      const profile = await api.get('/users/profile');
      setCurrentUser(profile);
    } catch {
      const fallback = DEMO_USERS.find(u => u.uid === userId);
      if (fallback) setCurrentUser(fallback);
    }
  };

  const updateUserProfile = async (updates) => {
    const updated = await api.put('/users/profile', updates);
    setCurrentUser(updated);
    return updated;
  };

  const reloadProfile = async () => {
    try {
      const profile = await api.get('/users/profile');
      setCurrentUser(profile);
    } catch (e) {
      console.warn('Could not reload profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseLive,
        demoUsers: DEMO_USERS,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        switchDemoUser,
        updateUserProfile,
        reloadProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
