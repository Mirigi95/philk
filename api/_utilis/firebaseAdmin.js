import admin from "firebase-admin";
import { database } from "firebase-admin";
import "dotenv/config";

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

   // console.error("✅ Firebase Admin initialized");
  } catch (error) {
    console.error("❌ Firebase Admin init failed:", error.message);
  }
}

const auth = admin.auth();
const firestore = admin.firestore();

export { admin, auth, firestore };
