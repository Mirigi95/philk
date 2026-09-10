// api/auth/onboard.js
import { auth, firestore, admin } from "../_utilis/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  try {
    const token = header.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      idNumber, 
      clientId = "1234" // Default Sacco ID if not provided
    } = req.body;

    const batch = firestore.batch();

    // 1. Reference to the Global User (For Login & Auth mapping)
    const userRef = firestore.collection("users").doc(uid);
    
    // 2. Reference to the Member Profile (Inside the Sacco hierarchy)
    // Path: members/1234/members/uid
    const memberRef = firestore
      .collection("members")
      .doc(clientId)
      .collection("members")
      .doc(uid);

    // --- A. SET GLOBAL USER DATA ---
    batch.set(userRef, {
      uid,
      email,
      fullName: `${firstName} ${lastName}`,
      role: "MEMBER",
      clientId: clientId, // Links them to their Sacco
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // --- B. SET MEMBER PROFILE DATA ---
    batch.set(memberRef, {
      personal: {
        firstName,
        lastName,
        email,
        phone,
        idNumber,
      },
      sacco: {
        sharesAmount: 0,
        savingsAmount: 0,
        memberNumber: '', // Auto-gen member number
        status: "ACTIVE",
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    res.status(200).json({ 
      success: true, 
      message: "Onboarding complete",
      memberId: uid 
    });

  } catch (err) {
    //console.error("Onboarding Error:", err);
    res.status(500).json({ message: "Onboarding failed", error: err.message });
  }
}


export const verifySession = async (req, res) => {
    const clientId = req.headers["x-client-id"];
    const authHeader = req.headers["authorization"];

    if (!clientId || !authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Security headers missing or malformed" });
        return null;
    }

    try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await auth.verifyIdToken(token);

        // --- NEW: CROSS-CHECK WITH FIRESTORE ---
        const userDoc = await firestore.collection("users").doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
            res.status(403).json({ message: "User profile not found" });
            return null;
        }

        const userData = userDoc.data();

        // 1. Ensure the user is trying to access THEIR school, not someone else's
        if (userData.clientId !== clientId) {
            res.status(403).json({ message: "Unauthorized: we got you Intruder" });
            return null;
        }

        // 2. Return full info so your API knows the user's role too
        return {
            uid: decodedToken.uid,
            clientId: clientId,
            role: userData.role, // "admin", "member", "guarantor", "staff"
            name: userData.name
        };

    } catch (err) {
        res.status(401).json({ message: "Invalid or expired session" });
        return null;
    }
};

export const requirePin = async (req, res, next) => {
    const { uid } = req.user;

    const userDoc = await firestore.collection("users").doc(uid).get();
    if (!userDoc.exists) {
        return res.status(403).json({ message: "User not found" });
    }

    const { pinVerifiedAt } = userDoc.data();

    if (!pinVerifiedAt) {
        return res.status(403).json({
            message: "PIN verification required",
            requirePin: true
        });
    }

    const diffMinutes =
        (Date.now() - pinVerifiedAt.toDate().getTime()) / 60000;

    if (diffMinutes > 15) {
        return res.status(403).json({
            message: "PIN expired",
            requirePin: true
        });
    }

    next();
};
