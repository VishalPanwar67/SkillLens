// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDLLIJ0mULtFC04Q4kYeBxbya-mJnymgvM",
  authDomain: "skilllens-336b3.firebaseapp.com",
  projectId: "skilllens-336b3",
  storageBucket: "skilllens-336b3.firebasestorage.app",
  messagingSenderId: "181684149257",
  appId: "1:181684149257:web:910e737c8b180d0c142cd8",
  measurementId: "G-1025SKV0RR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();