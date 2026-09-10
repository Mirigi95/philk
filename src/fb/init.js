// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSsVs3uwSw2OBEIaKEtIGZlgxsuuWMmWI",
  authDomain: "philcare-k.firebaseapp.com",
  databaseURL: "https://philcare-k-default-rtdb.firebaseio.com",
  projectId: "philcare-k",
  storageBucket: "philcare-k.firebasestorage.app",
  messagingSenderId: "615741621649",
  appId: "1:615741621649:web:0ffc00fbb7a7d965840630",
  measurementId: "G-8ZHQNWDCMF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);