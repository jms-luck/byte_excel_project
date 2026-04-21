import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyACx1hXHJiPSRk1S5LqLjxf_EqBOVbeEMQ',
  authDomain: 'byteexcel-53d6d.firebaseapp.com',
  projectId: 'byteexcel-53d6d',
  storageBucket: 'byteexcel-53d6d.firebasestorage.app',
  messagingSenderId: '85260829829',
  appId: '1:85260829829:web:ad15a08abf3815ca4d95ec',
  measurementId: 'G-6ERGHWW2GJ',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { analytics };
