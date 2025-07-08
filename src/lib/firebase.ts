
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

let isFirebaseInitialized = false;

// Provide a mock/dummy firestore object as a fallback.
// This allows the app to build and run without a database connection,
// but API calls requiring the database will throw a clear error.
let firestore: admin.firestore.Firestore = {
    // This mock will cause a clear error message in the server logs if used.
    collection: () => {
        throw new Error('Firebase Admin SDK is not initialized. Check your server logs for configuration errors with FIREBASE_SERVICE_ACCOUNT_KEY.');
    }
} as unknown as admin.firestore.Firestore;

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountKey) {
    try {
        // Parse the service account key from the environment variable.
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

        // This is the critical fix: The private_key from a .env file often has its newlines escaped (as "\\n").
        // The firebase-admin SDK expects actual newline characters ('\n').
        // This line replaces the escaped newlines with actual newlines.
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
        // If initialization is successful, overwrite the mock with the real instance.
        firestore = admin.firestore();
        isFirebaseInitialized = true;
    } catch (error)
    {
        console.error('CRITICAL: Error initializing Firebase Admin SDK. Check FIREBASE_SERVICE_ACCOUNT_KEY in your .env file. It might be malformed JSON or have incorrect permissions.');
        console.error('Underlying error:', error);
    }
} else {
  if (process.env.NODE_ENV === 'production') {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. This is required for production.');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized.');
  }
}

export { firestore, isFirebaseInitialized };
