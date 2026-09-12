import { auth, firestore } from "../_utilis/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed authorization header" });
  }

  try {
    const token = header.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(token);

    // Fetch user profile from Firestore to get role and clientId
    const userDoc = await firestore.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      // FIXED: Referenced userDoc instead of undefined userData
      console.error("User document does not exist for UID:", decoded.uid);
      return res.status(403).json({ message: "User profile not found in database" });
    }

    const userData = userDoc.data();

    // Security check: Ensure clientId exists
    if (!userData?.clientId) {
      console.error("Missing clientId for user:", decoded.uid);
      return res.status(403).json({ message: "User is not assigned to a sacco" });
    }

    // Return authenticated payload matching your user schema
    return res.status(200).json({
      uid: decoded.uid,
      role: userData.role,
      clientId: userData.clientId,
      name: userData.name,
      email: decoded.email || userData.email,
      facility: userData.facility,
      practiseNo: userData.practiseNo,
      serverTime: Date.now(),
    });

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}