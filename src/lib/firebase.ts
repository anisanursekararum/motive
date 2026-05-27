import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyCwxQ2hvHfU-tDeEkMI9CiUcvP9nnssd04",
  authDomain: "motive-13052026.firebaseapp.com",
  projectId: "motive-13052026",
  storageBucket: "motive-13052026.firebasestorage.app",
  messagingSenderId: "129871654349",
  appId: "1:129871654349:web:5af017bd623e523870e884"
};

// Initialize Firebase only if it hasn't been initialized already (important for Next.js SSR)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut };
