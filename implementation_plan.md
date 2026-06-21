# Implementation Plan - Firebase Authentication & Firestore Integration

This plan details the steps to integrate Firebase Authentication and Firestore into the DevDuck AI dashboard and landing page. This will replace the mock login flow with real user registration, login, session validation, and project sync to the cloud.

---

## User Review Required

> [!IMPORTANT]
> - You will need to create a **Firebase Web Project** in the Firebase Console (https://console.firebase.google.com).
> - Enable **Email/Password** provider (and optionally Google/GitHub) under the **Build > Authentication** section.
> - Enable **Cloud Firestore** under the **Build > Firestore Database** section.
> - Add your Firebase SDK keys to your `web/.env.local` file (template provided in the plan).

---

## Proposed Changes

### Component 1: Dependency Setup

#### [MODIFY] [package.json](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/package.json)
- Install the official `firebase` npm library.

---

### Component 2: Firebase SDK Configuration

#### [NEW] [firebase.ts](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/lib/firebase.ts)
- Initialize Firebase Client App, Authentication (`auth`), and Firestore Database (`db`) using environment variables.
- Export auth instance and db instance.

#### [NEW] [.env.local](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/.env.local)
- Template environment variables file containing placeholder values for Firebase config:
  ```env
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
  ```

---

### Component 3: Landing Page Auth Forms

#### [MODIFY] [page.tsx](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/page.tsx)
- Connect Sign Up form to Firebase `createUserWithEmailAndPassword`.
- Connect Sign In form to Firebase `signInWithEmailAndPassword`.
- Connect Google & GitHub OAuth buttons to Firebase Auth popups.
- Show clear Firebase auth error messages in the modals.

---

### Component 4: Dashboard Session Guard & Project Sync

#### [MODIFY] [layout.tsx](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/dashboard/layout.tsx)
- Implement an `onAuthStateChanged` listener. If a user is not logged in, redirect them back to `/` (Landing page).
- Display the logged-in user's name/email in the side bar instead of static "Admin".
- Implement a functional logout button calling `signOut(auth)`.
- When adding a project, sync it to **Firestore** under `users/{uid}/projects/{slug}` as well as registering it locally.
- On dashboard mount, fetch projects registered in Firestore for this user and cache them in local storage.

---

## Verification Plan

### Automated Tests
- Run `npm run build` inside `web` folder to ensure clean typescript compilation.

### Manual Verification
- Add a valid Firebase credentials block to `web/.env.local` and run `npm run dev`.
- Attempt to Sign Up with a new email. Verify the user account is created in the Firebase console.
- Attempt to Login. Verify redirection to dashboard.
- Create a new project context. Verify it syncs to Firestore in your Firebase Database console.
- Verify logging out redirects you back to the home page.
