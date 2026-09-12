import {auth, firestore} from "../_utilis/firebaseAdmin.js"

export default async function handler(req, res) {
  // 1. Verify Authorization Header
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const token = header.split("Bearer ")[1];
    await auth.verifyIdToken(token); // Authenticate request
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const { method } = req;

  switch (method) {
    // READ ALL CLIENTS
    case "GET": {
      try {
        const snapshot = await firestore.collection("clients").get();
        const clients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return res.status(200).json(clients);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch clients", error: error.message });
      }
    }

    // CREATE NEW CLIENT
    case "POST": {
      try {
        const {
          clientId,
          fullName,
          idNo,
          phone,
          address,
          dob,
          age,
          bloodPressure,
          oxygenSaturation,
          painLevel,
          pulse,
          respiratoryRate,
          temperature,
        } = req.body;

        if (!clientId || !fullName || !idNo) {
          return res.status(400).json({ message: "clientId, fullName, and idNo are required." });
        }

        const newClient = {
          clientId,
          fullName,
          idNo,
          phone: phone || "",
          address: address || "",
          dob: dob || "",
          age: age || "",
          bloodPressure: bloodPressure || "",
          oxygenSaturation: oxygenSaturation || "",
          painLevel: painLevel || "",
          pulse: pulse || "",
          respiratoryRate: respiratoryRate || "",
          temperature: temperature || "",
          createdAt: new Date().toISOString(),
        };

        // Use clientId as the document ID (or auto-generate with .add())
        await firestore.collection("clients").doc(clientId).set(newClient);

        return res.status(201).json({ message: "Client created successfully", client: newClient });
      } catch (error) {
        return res.status(500).json({ message: "Failed to create client", error: error.message });
      }
    }

    // UPDATE EXISTING CLIENT
    case "PUT": {
      try {
        const { clientId, ...updateData } = req.body;

        if (!clientId) {
          return res.status(400).json({ message: "clientId is required for updating." });
        }

        const clientRef = firestore.collection("clients").doc(clientId);
        const doc = await clientRef.get();

        if (!doc.exists) {
          return res.status(404).json({ message: "Client not found" });
        }

        await clientRef.update({
          ...updateData,
          updatedAt: new Date().toISOString(),
        });

        return res.status(200).json({ message: "Client updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: "Failed to update client", error: error.message });
      }
    }

    // DELETE CLIENT
    case "DELETE": {
      try {
        const { clientId } = req.query; // e.g., /api/clients?clientId=PHIL/25/004

        if (!clientId) {
          return res.status(400).json({ message: "clientId query parameter is required." });
        }

        await firestore.collection("clients").doc(clientId).delete();
        return res.status(200).json({ message: "Client deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: "Failed to delete client", error: error.message });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}