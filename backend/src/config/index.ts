import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '10000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'somi-go',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }
};

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

export function initFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    if (config.firebase.serviceAccountBase64) {
      const decodedJson = Buffer.from(config.firebase.serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId
      });
      console.log('Firebase Admin SDK initialized using base64 service account.');
    } else if (config.firebase.clientEmail && config.firebase.privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey
        }),
        projectId: config.firebase.projectId
      });
      console.log('Firebase Admin SDK initialized using clientEmail and privateKey.');
    } else {
      // Default initialization using Google Cloud / environment project id
      firebaseApp = admin.initializeApp({
        projectId: config.firebase.projectId
      });
      console.log(`Firebase Admin SDK initialized with project ID: ${config.firebase.projectId}`);
    }
  } catch (error: any) {
    console.warn(`Firebase Admin SDK init notice: ${error.message}. Running in graceful verification mode.`);
    firebaseApp = admin.initializeApp({
      projectId: config.firebase.projectId
    });
  }

  return firebaseApp;
}
