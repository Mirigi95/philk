import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import "dotenv/config";

if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
    );

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: "https://philcare-k-default-rtdb.firebaseio.com",
    });

    console.log("✅ Firebase Admin initialized");
  } catch (error) {
    console.error("❌ Firebase Admin init failed:", error.message);
  }
}

const auth = getAuth();
const firestore = getFirestore();

export { auth, firestore };