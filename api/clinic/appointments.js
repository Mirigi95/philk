import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";

// Helper to format date into MM/YY string
function getMMYY(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

export default async function handler(req, res) {
  // 1. Authenticate & extract tenant session
  const session = await verifySession(req, res);
  if (!session) return; // verifySession returns 401/403 directly on failure

  const facilityId = session.clientId;
  const createdBy = session.name || "System";

  if (!facilityId) {
    return res.status(403).json({ message: "User account is not assigned to a facility." });
  }

  // Multi-tenant subcollection targeting the user's facility
  const facilityRef = firestore.collection("facility").doc(facilityId);
  const apptsCollection = facilityRef.collection("appointments");
  const counterRef = facilityRef.collection("counters").doc("appointments");

  const { method } = req;

  switch (method) {
    // READ APPOINTMENTS
    case "GET": {
      try {
        const snapshot = await apptsCollection.orderBy("createdAt", "desc").get();
        const appointments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json(appointments);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
      }
    }

    // CREATE APPOINTMENT (With Custom Formatted ID 01/MM/YY)
    case "POST": {
      try {
        const { clientId, clientName, appointmentDate, doctorName, notes, status } = req.body;

        if (!clientId || !appointmentDate) {
          return res.status(400).json({ message: "clientId and appointmentDate are required." });
        }

        const mmYY = getMMYY(appointmentDate);

        // Transaction ensures concurrent creates do not generate duplicate sequence numbers
        const appointmentData = await firestore.runTransaction(async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          
          let currentSeq = 1;
          if (counterDoc.exists) {
            currentSeq = (counterDoc.data().currentSequence || 0) + 1;
          }

          // Format sequence number (e.g., 1 -> "01", 12 -> "12")
          const formattedSeq = String(currentSeq).padStart(2, "0");
          const customId = `${formattedSeq}/${mmYY}`;

          // Document ID in Firestore (replacing slashes to avoid path issues)
          const docId = `${formattedSeq}-${mmYY.replace("/", "-")}`;
          const newDocRef = apptsCollection.doc(docId);

          const newAppointment = {
            appointmentId: customId,
            clientId,
            clientName: clientName || "",
            appointmentDate,
            doctorName: doctorName || session.name || "",
            notes: notes || "",
            status: status || "Scheduled",
            createdBy,
            createdAt: new Date().toISOString(),
          };

          // Update sequence counter and write new appointment
          transaction.set(counterRef, { currentSequence: currentSeq }, { merge: true });
          transaction.set(newDocRef, newAppointment);

          return { id: docId, ...newAppointment };
        });

        return res.status(201).json({
          message: "Appointment created successfully",
          id: appointmentData.id,
          appointment: appointmentData,
        });
      } catch (error) {
        return res.status(500).json({ message: "Failed to create appointment", error: error.message });
      }
    }

    // UPDATE APPOINTMENT
    case "PUT": {
      try {
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Appointment ID (id) is required." });
        }

        const apptRef = apptsCollection.doc(id);
        const doc = await apptRef.get();

        if (!doc.exists) {
          return res.status(404).json({ message: "Appointment not found in your facility" });
        }

        await apptRef.update({
          ...updateData,
          updatedAt: new Date().toISOString(),
        });

        return res.status(200).json({ message: "Appointment updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: "Failed to update appointment", error: error.message });
      }
    }

    // DELETE APPOINTMENT
    case "DELETE": {
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: "Appointment id is required." });
        }

        const apptRef = apptsCollection.doc(id);
        const doc = await apptRef.get();

        if (!doc.exists) {
          return res.status(404).json({ message: "Appointment not found in your facility" });
        }

        await apptRef.delete();
        return res.status(200).json({ message: "Appointment deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: "Failed to delete appointment", error: error.message });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}