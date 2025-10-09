import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB0PMx6NEUEdtONL_J8W0NXdN6qE2YINhk",
  authDomain: "preco-rapida.firebaseapp.com",
  projectId: "preco-rapida",
  storageBucket: "preco-rapida.firebasestorage.app",
  messagingSenderId: "754567032497",
  appId: "1:754567032497:web:ae10eba9dc5c528d1abc90",
  measurementId: "G-3XFZX9VJLD"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
