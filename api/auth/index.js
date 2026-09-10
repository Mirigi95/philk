import { auth, firestore } from "../_utilis/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  try {
    const token = header.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(token);

    // Fetch user profile from Firestore to get role and schoolId
    const userDoc = await firestore.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists) {
         //console.error(userData.exists);
      return res.status(403).json({ message: "User profile not found in database" });
    }

    const userData = userDoc.data();

    // Security check: Ensure schoolId exists
    if (!userData.clientId) {
      console.error(userData.clientId);
      return res.status(403).json({ message: "User is not assigned to a sacco" });
    }
    //console.log(userData);

    // Return the data plus a session start timestamp
    res.json({
      uid: decoded.uid,
      role: userData.role,
      clientId: userData.clientId,
      name: userData.name,
      email: decoded.email,
      serverTime: Date.now(), // Used by frontend to sync auto-logout
    });

  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}