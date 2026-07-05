import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { DailyLog, UserProfile, HabitStatus } from "./types";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Request Workspace scopes
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/documents");
provider.addScope("https://www.googleapis.com/auth/tasks");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Retrieve cached access token from memory or try to get a silent session
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Fallback or wait for user to click button if we don't have token in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Firestore helper functions
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (
  userId: string,
  email: string,
  displayName: string
): Promise<UserProfile> => {
  const userRef = doc(db, "users", userId);
  const profile: UserProfile = {
    uid: userId,
    email,
    displayName,
    currentDay: 1,
    startDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  };
  await setDoc(userRef, profile);
  return profile;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updates);
};

// Retrieve all daily logs for a user
export const getUserLogs = async (userId: string): Promise<DailyLog[]> => {
  const logsColRef = collection(db, "users", userId, "logs");
  const querySnap = await getDocs(logsColRef);
  const logs: DailyLog[] = [];
  querySnap.forEach((doc) => {
    logs.push(doc.data() as DailyLog);
  });
  return logs.sort((a, b) => a.dayNumber - b.dayNumber);
};

// Set or update a specific daily log
export const saveDailyLog = async (
  userId: string,
  log: DailyLog
): Promise<void> => {
  const logRef = doc(db, "users", userId, "logs", log.dayNumber.toString());
  await setDoc(logRef, log);
};

// Toggle habit status directly
export const updateHabitStatus = async (
  userId: string,
  dayNumber: number,
  habitKey: keyof DailyLog,
  status: HabitStatus
): Promise<void> => {
  const logRef = doc(db, "users", userId, "logs", dayNumber.toString());
  await updateDoc(logRef, { [habitKey]: status });
};
