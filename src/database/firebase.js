import { initializeApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXGdq9DJ4h_bGuGVwTP2ssBxBjgSSAJcA",
  authDomain: "realcar-1add0.firebaseapp.com",
  projectId: "realcar-1add0",
  storageBucket: "realcar-1add0.appspot.com",
  messagingSenderId: "308975762780",
  appId: "1:308975762780:web:d5b8b81e16291b62861599",
  measurementId: "G-NHHPKR71VL"
};




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
export { auth, firestore, storage };