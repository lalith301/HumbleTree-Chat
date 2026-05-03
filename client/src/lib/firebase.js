import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtKXr5nbDt4HfDwTgQSu0c-fRePWpd6bM",
  authDomain: "humbletree-1bf88.firebaseapp.com",
  projectId: "humbletree-1bf88",
  storageBucket: "humbletree-1bf88.firebasestorage.app",
  messagingSenderId: "396034418120",
  appId: "1:396034418120:web:faa2974f515e35fce94cfd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Store recaptcha instance globally to avoid re-initialization
let recaptchaVerifier = null;

export const setupRecaptcha = () => {
    // Clear existing recaptcha if any
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
            recaptchaVerifier = null;
        }
    });

    return recaptchaVerifier;
};

export { signInWithPhoneNumber, signInWithPopup };
export default app;