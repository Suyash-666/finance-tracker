// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  // MFA + Phone + TOTP
  multiFactor,
  getMultiFactorResolver,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5gssj6GDWL7FysOCQZ-ieLkQOuGwWkuE",
  authDomain: "finance-tracker-50234.firebaseapp.com",
  projectId: "finance-tracker-50234",
  storageBucket: "finance-tracker-50234.firebasestorage.app",
  messagingSenderId: "84020516201",
  appId: "1:84020516201:web:d2386454c28db96170d9f8",
  measurementId: "G-WHT9YE2P94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// ===== MFA helpers (TOTP + SMS) =====

// TOTP enrollment: step 1 - generate secret and QR URL
export async function startTotpEnrollment(user, { accountName, issuer } = {}) {
  const session = await multiFactor(user).getSession();
  const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = totpSecret.generateQrCodeUrl(
    accountName || user.email || 'user',
    issuer || 'FinanceTracker'
  );
  return { totpSecret, qrCodeUrl };
}

// TOTP enrollment: step 2 - verify code and enroll
export async function finalizeTotpEnrollment(user, totpSecret, verificationCode, displayName) {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, verificationCode);
  await multiFactor(user).enroll(assertion, displayName || 'TOTP');
}

// Sign-in: build resolver from auth/multi-factor-auth-required error
export function createMfaResolverFromError(error) {
  return getMultiFactorResolver(auth, error);
}

// Sign-in with TOTP factor
export async function resolveMfaSignInWithTotp(resolver, enrollmentId, verificationCode) {
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, verificationCode);
  return resolver.resolveSignIn(assertion);
}

// SMS enrollment: step 1 - send code (requires a div id for reCAPTCHA)
export async function startSmsEnrollment(user, phoneNumber, recaptchaContainerId, recaptchaParams = { size: 'invisible' }) {
  const session = await multiFactor(user).getSession();
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, recaptchaParams);
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber({ phoneNumber, session }, verifier);
  return {
    verificationId,
    clearRecaptcha: () => verifier.clear()
  };
}

// SMS enrollment: step 2 - verify code and enroll
export async function finalizeSmsEnrollment(user, verificationId, smsCode, displayName) {
  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(user).enroll(assertion, displayName || 'SMS');
}

// Sign-in: send SMS for selected phone hint
export async function sendMfaSignInSms(resolver, phoneHint, recaptchaContainerId, recaptchaParams = { size: 'invisible' }) {
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, recaptchaParams);
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    { multiFactorHint: phoneHint, session: resolver.session },
    verifier
  );
  return {
    verificationId,
    clearRecaptcha: () => verifier.clear()
  };
}

// Sign-in: complete with SMS code
export async function resolveMfaSignInWithSms(resolver, verificationId, smsCode) {
  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  return resolver.resolveSignIn(assertion);
}

// Utility: check enrolled factors
export function getEnrolledFactors(user) {
  return multiFactor(user).enrolledFactors || [];
}

// Utility: unenroll a factor (accepts MultiFactorInfo or enrollmentId string)
export async function unenrollMfaFactor(user, factorOrId) {
  await multiFactor(user).unenroll(factorOrId);
}

export default app;