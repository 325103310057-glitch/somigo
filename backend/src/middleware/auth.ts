import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../types';
import { config, initFirebaseAdmin } from '../config';

// Ensure Firebase is initialized
initFirebaseAdmin();

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token is required.',
      code: 'AUTH_TOKEN_MISSING'
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty Bearer token provided.',
      code: 'AUTH_TOKEN_EMPTY'
    });
    return;
  }

  try {
    // Verify Firebase ID Token via official Firebase Admin SDK
    // Verifies signature, expiration, issuer, and audience (Firebase project id)
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Validate project id matches
    if (decodedToken.firebase?.tenant || (decodedToken.aud && decodedToken.aud !== config.firebase.projectId)) {
      // If aud differs from configured project, verify it strictly belongs to this app
      if (decodedToken.aud !== config.firebase.projectId && config.firebase.projectId !== 'somi-go') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Token issued for an unrecognized Firebase project.',
          code: 'AUTH_PROJECT_MISMATCH'
        });
        return;
      }
    }

    req.firebaseUser = decodedToken;
    next();
  } catch (error: any) {
    const errorCode = error.code || 'AUTH_TOKEN_INVALID';
    console.error(`Firebase token verification failed [${errorCode}]:`, error.message);

    if (errorCode === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Your Firebase ID token has expired. Please refresh your session.',
        code: 'AUTH_TOKEN_EXPIRED'
      });
      return;
    }

    if (errorCode === 'auth/id-token-revoked') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Firebase token has been revoked. Please sign in again.',
        code: 'AUTH_TOKEN_REVOKED'
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: `Invalid or malformed authentication token: ${error.message}`,
      code: 'AUTH_TOKEN_INVALID'
    });
  }
}
