import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ensureUserDocument = async (firebaseUser, extraData = {}) => {
  if (!firebaseUser) return null;

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const defaults = {
      full_name: extraData.full_name || firebaseUser.displayName || '',
      email: firebaseUser.email,
      phone: extraData.phone || firebaseUser.phoneNumber || '',
      photo_url: extraData.photo_url || firebaseUser.photoURL || '',
      created_date: new Date(),
      banned: false,
      roles: extraData.roles || ['customer'],
      approved_roles: extraData.approved_roles || ['customer'],
      ...extraData
    };

    await setDoc(userRef, defaults, { merge: true });
    return { id: firebaseUser.uid, email: firebaseUser.email, ...defaults };
  }

  if (Object.keys(extraData).length > 0) {
    await setDoc(userRef, extraData, { merge: true });
  }

  return { id: firebaseUser.uid, email: firebaseUser.email, ...snapshot.data(), ...extraData };
};

export const firebaseAuth = {
  // Login with email/password
  login: async (email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return await ensureUserDocument(result.user);
  },

  // Register with email/password
  register: async (email, password, userData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
      ...userData,
      email,
      created_date: new Date(),
      banned: false,
      roles: userData.roles || ['customer'],
      approved_roles: userData.approved_roles || []
    });
    return { id: result.user.uid, email, ...userData };
  },

  loginWithGoogle: async (extraData = {}) => {
    await setPersistence(auth, browserLocalPersistence);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    return await ensureUserDocument(result.user, extraData);
  },

  // Logout
  logout: () => signOut(auth),

  // Get current user
  getCurrentUser: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return { id: user.uid, email: user.email, ...userDoc.data() };
  },

  // Listen to auth state changes
  onAuthChange: (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const hydrated = await ensureUserDocument(firebaseUser);
        callback(hydrated);
      } else {
        callback(null);
      }
    });
  }
};

export default firebaseAuth;
