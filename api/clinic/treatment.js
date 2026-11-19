import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(req, res) {
  const session = await verifySession(req, res);
  if (!session) return; // verifySession sends a 401 response if unauthenticated

  const tenantId = session.clientId;
  const { method } = req;

  // Collection reference scoped to the authenticated facility/tenant
  const treatmentCollection = firestore
    .collection("facility")
    .doc(tenantId)
    .collection("treatments");

  // FIXED: Corrected collection name from "appointmentss" to "appointments"
  const appointmentCollection = firestore
    .collection("facility")
    .doc(tenantId)
    .collection("appointments");

  switch (method) {
    case "POST": {
      try {
        const {
          appointmentId = "",
          clientId = "",
          patientId = "",
          doctorId = session.uid || "",
          doctorEmail = session.email || "",
          diagnosisCode = "",
          diagnosisNotes = "",
          treatment = "",
          notes = "",
          followUpInterval = "0",
          followUpDate = null,
          hasAllergies = false,
          allergies = "",
          prescription = [],
          tests = [],
          vitalSigns = {},
        } = req.body;

        // Basic schema normalization
        const formattedPrescription = Array.isArray(prescription)
          ? prescription.map((item) => ({
            medication: String(item?.medication || ""),
            frequency: String(item?.frequency || ""),
          }))
          : [];

        const formattedVitalSigns = {
          bloodPressure: String(vitalSigns?.bloodPressure || ""),
          oxygenSaturation: String(vitalSigns?.oxygenSaturation || ""),
          pulse: String(vitalSigns?.pulse || ""),
          respiratoryRate: String(vitalSigns?.respiratoryRate || ""),
          temperature: String(vitalSigns?.temperature || ""),
        };

        // Format allergies into both raw text and an array for the UI
        const allergiesRaw = Boolean(hasAllergies) ? String(allergies) : "";
        const allergiesList = allergiesRaw
          ? allergiesRaw.split(",").map((a) => a.trim()).filter(Boolean)
          : [];

        const treatmentDoc = {
          allergies: allergiesRaw,
          allergiesList,
          hasAllergies: Boolean(hasAllergies),
          appointmentId: String(appointmentId),
          clientId: String(clientId),
          createdAt: FieldValue.serverTimestamp(),
          date: FieldValue.serverTimestamp(),
          diagnosisCode: String(diagnosisCode),
          diagnosisNotes: String(diagnosisNotes),
          doctorEmail: String(doctorEmail),
          doctorId: String(doctorId),
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          followUpInterval: String(followUpInterval),
          notes: String(notes),
          patientId: String(patientId),
          prescription: formattedPrescription,
          tests: Array.isArray(tests) ? tests.map(String) : [],
          treatment: String(treatment),
          vitalSigns: formattedVitalSigns,
        };

        const docRef = await treatmentCollection.add(treatmentDoc);

        // Update appointment status to completed
        if (appointmentId) {
          try {
            const cleanAppointmentId = String(appointmentId).trim();
            
            // OPTION 1: Direct document update (Fastest & most reliable if appointmentId is the Firestore doc ID)
            const appointmentDocRef = appointmentCollection.doc(cleanAppointmentId);
            const docSnap = await appointmentDocRef.get();

            if (docSnap.exists) {
              await appointmentDocRef.set(
                {
                  status: "completed",
                  consultationId: docRef.id,
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
              console.log(`Successfully updated appointment document ID: ${cleanAppointmentId} to completed.`);
            } else {
              // OPTION 2: Fallback to query if appointmentId is a custom string field rather than the doc ID
              const appointmentQuery = await appointmentCollection
                .where("appointmentId", "==", cleanAppointmentId)
                .limit(1)
                .get();

              if (!appointmentQuery.empty) {
                const targetRef = appointmentQuery.docs[0].ref;
                await targetRef.set(
                  {
                    status: "completed",
                    consultationId: docRef.id,
                    updatedAt: FieldValue.serverTimestamp(),
                  },
                  { merge: true }
                );
                console.log(`Successfully updated appointment via field query for: ${cleanAppointmentId}`);
              } else {
                console.warn(`No appointment found with ID or field: "${cleanAppointmentId}"`);
              }
            }
          } catch (updateErr) {
            console.error("Failed to update appointment status:", updateErr);
          }
        }

        return res.status(201).json({
          message: "Treatment record saved successfully",
          id: docRef.id,
          data: treatmentDoc,
        });
      } catch (error) {
        console.error("Error creating treatment record:", error);
        return res.status(500).json({ error: "Failed to process treatment record" });
      }
    }

    case "GET": {
      try {
        const { appointmentId, patientId, clientId, id } = req.query;

        const targetClientId = clientId || id;

        let query = treatmentCollection;

        if (appointmentId) {
          query = query.where("appointmentId", "==", String(appointmentId));
        } else if (patientId) {
          query = query.where("patientId", "==", String(patientId));
        } else if (targetClientId) {
          query = query.where("clientId", "==", String(targetClientId));
        }

        const snapshot = await query.get();

        const toISOString = (value) => {
          if (!value) return null;

          if (typeof value.toDate === "function") {
            return value.toDate().toISOString();
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === "string") {
            return value;
          }
          return null;
        };

        const records = snapshot.docs.map((doc) => {
          const data = doc.data();

          const createdAt = toISOString(data.createdAt);
          const date = toISOString(data.date);
          const followUpDate = toISOString(data.followUpDate);

          const allergiesList = Array.isArray(data.allergiesList)
            ? data.allergiesList
            : data.allergies
              ? String(data.allergies)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
              : [];

          return {
            id: doc.id,
            ...data,
            createdAt,
            date,
            followUpDate,
            allergiesList,
            prescription: Array.isArray(data.prescription) ? data.prescription : [],
            tests: Array.isArray(data.tests) ? data.tests.map((test) => String(test)) : [],
            vitalSigns: data.vitalSigns || {},
          };
        });

        return res.status(200).json({ records });
      } catch (error) {
        console.error("Error retrieving treatments:", error);
        return res.status(500).json({
          error: "Failed to retrieve treatment records",
        });
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  }
}