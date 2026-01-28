import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAOLmDO9XJ_KDoTe_05DpcxymN8xLlENGI",
    authDomain: "nl-travel-app-f9563.firebaseapp.com",
    projectId: "nl-travel-app-f9563",
    storageBucket: "nl-travel-app-f9563.firebasestorage.app",
    messagingSenderId: "384044979553",
    appId: "1:384044979553:web:ba2ad4fd16c0b48709a120"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
