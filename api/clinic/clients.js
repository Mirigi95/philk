import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";

export default async function handler(req, res) {
  // 1. Authenticate & extract session info
  const session = await verifySession(req, res);
  
  if (!session) return; // verifySession manages 401 response if missing/invalid

  const tenantId = session.clientId; // Fixed typo: clientId instead of clientsId
  const createdBy = session.name || "System";
  console.log("used id", tenantId);

  const { method } = req;

  // Collection scoped to the authenticated tenant/facility
  const clientsCollection = firestore
    .collection("facility")
    .doc(tenantId)
    .collection("clients");

  switch (method) {
    // READ ALL CLIENTS
    case "GET": {
      try {
        const snapshot = await clientsCollection.orderBy("createdAt", "desc").get();
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

        // Sanitize document ID replacing slashes to avoid nested path errors
        const docId = clientId.replace(/\//g, "-");

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
          painLevel: painLevel || "0",
          pulse: pulse || "",
          respiratoryRate: respiratoryRate || "",
          temperature: temperature || "",
          createdBy,
          createdAt: new Date().toISOString(),
        };

        await clientsCollection.doc(docId).set(newClient);

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

        const docId = clientId.replace(/\//g, "-");
        const clientRef = clientsCollection.doc(docId);
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
        const { clientId } = req.query;

        if (!clientId) {
          return res.status(400).json({ message: "clientId query parameter is required." });
        }

        const docId = clientId.replace(/\//g, "-");
        await clientsCollection.doc(docId).delete();
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