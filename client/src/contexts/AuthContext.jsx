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

export const DEMO_USERS = [];

export const sanitizeDisplayName = (name, uid, email) => {
  if (!name) return email ? email.split('@')[0] : 'Người dùng';
  if (uid && (name === uid || name === uid.toUpperCase() || name.includes(uid))) {
    return email ? email.split('@')[0] : 'Người dùng';
  }
  if (name.length >= 25 && !name.includes(' ')) {
    return email ? email.split('@')[0] : 'Người dùng';
  }
  return name;
};

export const getDicebearAvatar = (uid) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid || 'user'}`;

export const sanitizePhotoURL = (photoURL, uid) => {
  if (!photoURL || photoURL.includes('googleusercontent.com')) {
    return getDicebearAvatar(uid);
  }
  return photoURL;
};

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

          const googleName = fbUser.displayName || '';
          const googleEmail = fbUser.email || '';

          try {
            let profile = await api.get('/users/profile').catch(() => null);

            // Google login users should NOT use Google's photoURL, but use Kho Avatar (DiceBear)
            const profilePhoto = sanitizePhotoURL(profile?.photoURL, fbUser.uid);

            const isDummyOrOutdated = !profile ||
              !profile.email ||
              profile.email.includes('@spliqo.local') ||
              !profile.displayName ||
              profile.displayName === fbUser.uid ||
              profile.displayName === fbUser.uid.toUpperCase() ||
              (profile.displayName.length >= 25 && !profile.displayName.includes(' ')) ||
              (profile.photoURL && profile.photoURL.includes('googleusercontent.com'));

            if (isDummyOrOutdated && (googleName || googleEmail || profilePhoto)) {
              try {
                profile = await api.put('/users/profile', {
                  displayName: sanitizeDisplayName(googleName || profile?.displayName, fbUser.uid, googleEmail),
                  email: googleEmail || profile?.email,
                  photoURL: profilePhoto,
                });
              } catch (err) {}
            }

            const activeUser = {
              ...(profile || {}),
              uid: fbUser.uid,
              displayName: sanitizeDisplayName(profile?.displayName || googleName, fbUser.uid, fbUser.email),
              email: (profile?.email && !profile.email.includes('@spliqo.local'))
                ? profile.email
                : (googleEmail || profile?.email || ''),
              photoURL: profilePhoto,
            };

            setCurrentUser(activeUser);
          } catch (e) {
            setCurrentUser({
              uid: fbUser.uid,
              displayName: sanitizeDisplayName(googleName, fbUser.uid, googleEmail),
              email: googleEmail || '',
              photoURL: getDicebearAvatar(fbUser.uid),
            });
          }
        } else {
          localStorage.removeItem('splitmate_token');
          localStorage.removeItem('splitmate_user_id');
          setCurrentUser(null);
        }
        setLoading(false);
      });
    } else {
      // Offline / Local storage session check
      const savedUserId = localStorage.getItem('splitmate_user_id');
      if (savedUserId) {
        api.get('/users/profile')
          .then((profile) => {
            setCurrentUser(profile);
          })
          .catch(() => {
            localStorage.removeItem('splitmate_user_id');
            setCurrentUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
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
      const uId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const user = {
        uid: uId,
        email,
        displayName: email.split('@')[0],
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
      };
      localStorage.setItem('splitmate_user_id', user.uid);
      setCurrentUser(user);
      await api.put('/users/profile', user).catch(() => {});
      return user;
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
      const fbUser = cred.user;
      const token = await fbUser.getIdToken();
      localStorage.setItem('splitmate_token', token);
      localStorage.setItem('splitmate_user_id', fbUser.uid);

      const realDisplayName = sanitizeDisplayName(fbUser.displayName, fbUser.uid, fbUser.email);
      const realEmail = fbUser.email || '';

      // Immediately sync authentic Google credentials to backend database without Google photo
      let profile = null;
      try {
        const existingProfile = await api.get('/users/profile').catch(() => null);
        const userPhoto = sanitizePhotoURL(existingProfile?.photoURL, fbUser.uid);

        profile = await api.put('/users/profile', {
          uid: fbUser.uid,
          displayName: realDisplayName,
          email: realEmail,
          photoURL: userPhoto,
        });
      } catch (e) {
        profile = await api.get('/users/profile').catch(() => null);
      }

      const activeUser = {
        ...(profile || {}),
        uid: fbUser.uid,
        displayName: realDisplayName,
        email: realEmail,
        photoURL: sanitizePhotoURL(profile?.photoURL, fbUser.uid),
      };

      setCurrentUser(activeUser);
      return activeUser;
    } else {
      throw new Error('Đăng nhập Google yêu cầu cấu hình Firebase.');
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
    if (!userId) return;
    localStorage.setItem('splitmate_user_id', userId);
    try {
      const profile = await api.get('/users/profile');
      setCurrentUser(profile);
    } catch {
      // ignore
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
