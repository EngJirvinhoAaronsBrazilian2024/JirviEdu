import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0812606136",
  appId: "1:295239486202:web:0a9be6af32d5e0848c9743",
  apiKey: "AIzaSyCzdYWP3re5O5StOQPsyyuoxdC1otcPbmk",
  authDomain: "gen-lang-client-0812606136.firebaseapp.com",
  storageBucket: "gen-lang-client-0812606136.firebasestorage.app",
  messagingSenderId: "295239486202"
};

const app = initializeApp(firebaseConfig);
export const firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, 'ai-studio-3e1466ff-f406-4abb-ac00-c3b774720bc1');
