import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";

export default async function handler(req, res) {
  // 1. Authenticate & extract tenant session (role, clientId, name, uid)
  const session = await verifySession(req, res);
  if (!session) return; // verifySession returns 401/403 directly on failure

  const facilityId = session.clientId;
  const createdBy = session.name || "System";

  if (!facilityId) {
    return res.status(403).json({ message: "User account is not assigned to a facility." });
  }

  // Multi-tenant subcollection targeting the user's facility
  const apptsCollection = firestore
    .collection("facility")
    .doc(facilityId)
    .collection("appointments");

  const { method } = req;

  switch (method) {
    // READ APPOINTMENTS (Scoped to user's facility)
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

    // CREATE APPOINTMENT
    case "POST": {
      try {
        const { clientId, clientName, appointmentDate, doctorName, notes, status } = req.body;

        if (!clientId || !appointmentDate) {
          return res.status(400).json({ message: "clientId and appointmentDate are required." });
        }

        const newAppointment = {
          clientId, // Patient ID
          clientName: clientName || "",
          appointmentDate,
          doctorName: doctorName || session.name || "",
          notes: notes || "",
          status: status || "Scheduled",
          createdBy,
          createdAt: new Date().toISOString(),
        };

        const docRef = await apptsCollection.add(newAppointment);

        return res.status(201).json({
          message: "Appointment created successfully",
          id: docRef.id,
          appointment: newAppointment,
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