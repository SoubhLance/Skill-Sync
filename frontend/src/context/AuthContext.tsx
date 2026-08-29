import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut, 
  onAuthStateChanged,
  isMockAuth,
  AppUser
} from '../lib/firebase';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const MOCK_USER_STORAGE_KEY = 'skillsync_mock_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockAuth) {
      // Check stored mock user in session
      const stored = sessionStorage.getItem(MOCK_USER_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            ...parsed,
            getIdToken: async () => 'mock-dev-token-skillsync-12345',
          });
        } catch (e) {
          setUser(null);
        }
      }
      setLoading(false);
      return;
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photoURL: fbUser.photoURL,
            getIdToken: () => fbUser.getIdToken(),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const loginWithGoogle = async () => {
    if (isMockAuth) {
      const mock: AppUser = {
        uid: 'mock-google-uid-100',
        email: 'alex.developer@skillsync.ai',
        displayName: 'Alex Mercer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        getIdToken: async () => 'mock-dev-token-skillsync-12345',
      };
      sessionStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({
        uid: mock.uid,
        email: mock.email,
        displayName: mock.displayName,
        photoURL: mock.photoURL,
      }));
      setUser(mock);
      return;
    }

    if (auth) {
      await signInWithPopup(auth, googleProvider);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isMockAuth) {
      const mock: AppUser = {
        uid: 'mock-email-uid-200',
        email: email,
        displayName: email.split('@')[0] || 'SkillSync User',
        photoURL: null,
        getIdToken: async () => 'mock-dev-token-skillsync-12345',
      };
      sessionStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({
        uid: mock.uid,
        email: mock.email,
        displayName: mock.displayName,
        photoURL: mock.photoURL,
      }));
      setUser(mock);
      return;
    }

    if (auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (isMockAuth) {
      await loginWithEmail(email, pass);
      return;
    }

    if (auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
    }
  };

  const logout = async () => {
    if (isMockAuth) {
      sessionStorage.removeItem(MOCK_USER_STORAGE_KEY);
      setUser(null);
      return;
    }

    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
