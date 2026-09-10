import { auth, firestore } from "../../_utilis/firebaseAdmin";

export default async function handler(req, res) {
  // Verify Auth Header
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const token = header.split("Bearer ")[1];
    await auth.verifyIdToken(token);
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const { method } = req;

  switch (method) {
    // READ APPOINTMENTS
    case "GET": {
      try {
        const { clientId } = req.query;
        let query = firestore.collection("appointments");

        // Filter by specific client if clientId parameter exists
        if (clientId) {
          query = query.where("clientId", "==", clientId);
        }

        const snapshot = await query.get();
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
          clientId,
          clientName: clientName || "",
          appointmentDate,
          doctorName: doctorName || "",
          notes: notes || "",
          status: status || "Scheduled", // Default status: Scheduled | Completed | Cancelled
          createdAt: new Date().toISOString(),
        };

        const docRef = await firestore.collection("appointments").add(newAppointment);

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
          return res.status(400).json({ message: "Appointment document ID (id) is required." });
        }

        const apptRef = firestore.collection("appointments").doc(id);
        const doc = await apptRef.get();

        if (!doc.exists) {
          return res.status(404).json({ message: "Appointment not found" });
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
        const { id } = req.query; // e.g., /api/appointments?id=DOCUMENT_ID

        if (!id) {
          return res.status(400).json({ message: "Appointment id is required." });
        }

        await firestore.collection("appointments").doc(id).delete();
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