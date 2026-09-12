// auth/verify.js
import { auth, firestore } from "../_utilis/firebaseAdmin.js";

export async function verifySession(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid token" });
    return null;
  }

  const token = header.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Fetch user profile from Firestore to supply role & clientId
    const userDoc = await firestore.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      res.status(403).json({ message: "User document not found" });
      return null;
    }

    const userData = userDoc.data();

    // Attach profile fields to returned session object
    return {
      ...decodedToken,
      role: userData.role,
      clientId: userData.clientId,
      name: userData.name,
    };
  } catch (error) {
    console.error("Session verification error:", error.message);
    res.status(401).json({ message: "Invalid or expired session" });
    return null;
  }
}