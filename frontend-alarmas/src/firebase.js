import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDoIz5EMYS9p5HPfxk3aAeWFvoZSWf56WY",
  authDomain: "int-alarma-smart.firebaseapp.com",
  projectId: "int-alarma-smart",
  storageBucket: "int-alarma-smart.firebasestorage.app",
  messagingSenderId: "864996695506",
  appId: "1:864996695506:web:e6fd29020ffad4e0387c0b",
  measurementId: "G-E1CN2HSJ6K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);