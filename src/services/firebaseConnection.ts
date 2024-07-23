import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAgo3Bfhg1rEkpr9XcZgOZvnh-46MiKiTs",
  authDomain: "tarefasplus-fcaee.firebaseapp.com",
  projectId: "tarefasplus-fcaee",
  storageBucket: "tarefasplus-fcaee.appspot.com",
  messagingSenderId: "630043031868",
  appId: "1:630043031868:web:e52335913506ff474c0639"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp)

export { db };