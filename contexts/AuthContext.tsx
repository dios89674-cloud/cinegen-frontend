"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In dev without Firebase config, provide a demo user so all pages render
    if (!firebaseAuth) {
      if (process.env.NODE_ENV === "development") {
        setUser({ uid: "loadtest_uid", email: "demo@cinegen.ai", displayName: "Demo User", getIdToken: async () => "loadtest-user" } as unknown as User);
        setToken("loadtest-user");
      }
      setLoading(false);
      return;
    }
    return onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      if (u) {
        const t = await u.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not initialized");
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!firebaseAuth) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
  };

  const logout = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, loginWithEmail, signupWithEmail, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
