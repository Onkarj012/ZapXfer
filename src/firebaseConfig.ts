import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBq2OA3jZTvTKYiKe9nWcmVwjVhCPHe9Uw',
  authDomain: 'zapxfer.firebaseapp.com',
  projectId: 'zapxfer',
  storageBucket: 'zapxfer.appspot.com',
  messagingSenderId: '61266136727',
  appId: '1:61266136727:web:151da56d1ff595711263d2',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
