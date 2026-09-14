import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(req, res) {
  const session = await verifySession(req, res);
  if (!session) return; // verifySession manages 401 response if missing/invalid

  const tenantId = session.clientId;
  const createdBy = session.name || "System";

  const { method } = req;

  // Firestore path scoped to the tenant/facility
  const treatmentCollection = firestore
    .collection("facility")
    .doc(tenantId)
    .collection("consultations"); // or "clients" depending on your subcollection architecture

  switch (method) {
    case "POST": {
      try {
        const {
          appointmentId = "",
          clientId = "",
          chiefComplaint = "",
          associatedSymptoms = "",
          onset = "",
          duration = "",
          severity = "",
          treatmentTried = "",
          historyOfIllness = "",
          reviewOfSystems = "",
          physicalExam = "",
          assessment = "",
          diagnosisCode = "",
          plan = "",
          medications = "",
          notes = "",
          followUpDate = null,
          hasAllergies = false,
          allergies = "",
          hasHistory = false,
          patientHistory = "null",
          familyHistory = "null",
          hasSocialHistory = false,
          socialHistory = "",
          vitalSigns = {},
        } = req.body;

        // Basic Validation
        if (!appointmentId || !chiefComplaint) {
          return res.status(400).json({
            error: "Missing required fields: appointmentId and chiefComplaint are required.",
          });
        }

        // Clean & Format Vital Signs Payload
        const formattedVitalSigns = {
          bloodPressure: String(vitalSigns?.bloodPressure || ""),
          temperature: String(vitalSigns?.temperature || ""),
          pulse: String(vitalSigns?.pulse || ""),
          respiratoryRate: String(vitalSigns?.respiratoryRate || ""),
          oxygenSaturation: String(vitalSigns?.oxygenSaturation || ""),
          painLevel: String(vitalSigns?.painLevel || "0"),
        };

        // Construct document payload matching your exact Firestore structure
        const consultationDoc = {
          appointmentId: String(appointmentId),
          clientId: String(clientId),
          doctor: createdBy,
          chiefComplaint: String(chiefComplaint),
          associatedSymptoms: String(associatedSymptoms),
          onset: String(onset),
          duration: String(duration),
          severity: String(severity),
          treatmentTried: String(treatmentTried),
          historyOfIllness: String(historyOfIllness),
          reviewOfSystems: String(reviewOfSystems),
          physicalExam: String(physicalExam),
          assessment: String(assessment),
          diagnosisCode: String(diagnosisCode),
          plan: String(plan),
          medications: String(medications),
          notes: String(notes),
          followUpDate: followUpDate ? new Date(followUpDate) : null,

          // Allergy & History Flags
          hasAllergies: Boolean(hasAllergies),
          allergies: Boolean(hasAllergies) ? String(allergies) : "",
          hasHistory: Boolean(hasHistory),
          patientHistory: hasHistory ? String(patientHistory) : "null",
          familyHistory: hasHistory ? String(familyHistory) : "null",
          hasSocialHistory: Boolean(hasSocialHistory),
          socialHistory: hasSocialHistory ? String(socialHistory) : "",

          // Nested Maps & System Timestamps
          vitalSigns: formattedVitalSigns,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Save to Firestore (Auto-generated document ID)
        const docRef = await treatmentCollection.add(consultationDoc);

        // Optionally update appointment status to "completed" or "in-progress"
        if (appointmentId) {
          await firestore
            .collection("facility")
            .doc(tenantId)
            .collection("appointments")
            .doc(appointmentId)
            .set(
              {
                status: "completed",
                consultationId: docRef.id,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
        }

        return res.status(201).json({
          message: "Consultation created successfully",
          id: docRef.id,
          data: consultationDoc,
        });
      } catch (error) {
        console.error("Error creating consultation:", error);
        return res.status(500).json({ error: "Failed to create consultation record" });
      }
    }

    case "GET": {
      try {
        const { appointmentId } = req.query;

        // Fetch by appointmentId if filtered
        if (appointmentId) {
          const snapshot = await treatmentCollection
            .where("appointmentId", "==", appointmentId)
            .get();

          if (snapshot.empty) {
            return res.status(404).json({ message: "No consultation record found" });
          }

          const records = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          return res.status(200).json(records[0]);
        }

        // Fallback: Fetch recent consultations
        const snapshot = await treatmentCollection
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();

        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json(records);
      } catch (error) {
        console.error("Error fetching consultations:", error);
        return res.status(500).json({ error: "Failed to fetch consultation records" });
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  }
}