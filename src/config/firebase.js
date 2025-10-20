// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCNQLAtMA4Ipy1GoX6NAkCpC6kkdK58HuQ",
    authDomain: "swp391-4cb7e.firebaseapp.com",
    projectId: "swp391-4cb7e",
    storageBucket: "swp391-4cb7e.firebasestorage.app",
    messagingSenderId: "1080882452025",
    appId: "1:1080882452025:web:fe70ed46ac81575d769fe8",
    measurementId: "G-8YS90CKVPL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };