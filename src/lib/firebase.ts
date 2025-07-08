
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. This is required for production.');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized.');
  }
}

let firestore: admin.firestore.Firestore;

if (serviceAccountKey) {
    try {
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
        firestore = admin.firestore();
    } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin SDK:', error);
    }
} else {
    // Provide a mock/dummy firestore object if the key is not present
    // This allows the app to build and run without a database connection,
    // though token validation will fail.
    firestore = {} as admin.firestore.Firestore; 
    console.log("Using mock Firestore instance. Token validation will not work.");
}

export { firestore };
