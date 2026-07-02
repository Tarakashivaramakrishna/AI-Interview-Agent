import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "interviewiq-9f568.firebaseapp.com",
  projectId: "interviewiq-9f568",
  storageBucket: "interviewiq-9f568.firebasestorage.app",
  messagingSenderId: "430277203500",
  appId: "1:430277203500:web:0ebde509810609af736389"
};
const app = initializeApp(firebaseConfig);

const auth=getAuth(app);

const provider=new GoogleAuthProvider();

export {auth,provider}