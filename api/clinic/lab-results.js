import { firestore } from "../_utilis/firebaseAdmin.js";
import { verifySession } from "../auth/verify.js";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

// ---------- Config ----------
const ALLOWED_ROLES = []; // e.g. ["lab", "admin"]; empty = any signed-in user

const RESULT_TYPES = ["numeric", "qualitative", "semi_quantitative", "text", "panel"];
const STATUSES = ["final", "preliminary", "corrected", "amended"];
const FLAGS = ["normal", "high", "low", "abnormal", "critical"];
const SEVERITY = { normal: 0, high: 1, low: 1, abnormal: 1, critical: 2 };
const MAX_COMPONENTS = 100;

// ---------- Helpers ----------
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const clean = (v, max) =>
  typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseDate = (v, field) => {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${field} is not a valid date.`);
  return d;
};

const worstFlag = (flags) =>
  flags.reduce((worst, f) => (SEVERITY[f] > SEVERITY[worst] ? f : worst), "normal");

function validatePayload(body) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Request body is required.");

  const appointmentId = clean(body.appointmentId ?? body.orderId, 128);
  const clientId = clean(body.clientId ?? body.patientId, 128);
  const consultationId = clean(body.consultationId, 128);
  const testName = clean(body.testName, 200);

  if (!appointmentId || !clientId || !testName) {
    throw new HttpError(400, "appointmentId, clientId and testName are required.");
  }
  if (appointmentId.includes("/") || consultationId.includes("/")) {
    throw new HttpError(400, "Invalid appointmentId or consultationId.");
  }

  const resultType = body.resultType || "numeric";
  if (!RESULT_TYPES.includes(resultType)) throw new HttpError(400, "Invalid result type.");

  const status = body.status || "final";
  if (!STATUSES.includes(status)) throw new HttpError(400, "Invalid result status.");

  const testedAt = parseDate(body.testedAt ?? body.recordedAt, "testedAt") ?? new Date();
  const collectedAt = parseDate(body.collectedAt, "collectedAt");
  if (testedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new HttpError(400, "Result time cannot be in the future.");
  }
  if (collectedAt && collectedAt > testedAt) {
    throw new HttpError(400, "Collection time cannot be after the result time.");
  }

  const data = {
    appointmentId,
    clientId,
    testName,
    resultType,
    status,
    specimenType: clean(body.specimenType, 50) || null,
    specimenId: clean(body.specimenId, 100) || null,
    collectedAt: collectedAt ? collectedAt.toISOString() : null,
    testedAt: testedAt.toISOString(),
    verifiedBy: clean(body.verifiedBy, 120) || null,
    labNotes: clean(body.labNotes, 5000),
  };

  if (resultType === "panel") {
    if (
      !Array.isArray(body.components) ||
      body.components.length === 0 ||
      body.components.length > MAX_COMPONENTS
    ) {
      throw new HttpError(400, "A panel needs between 1 and 100 components.");
    }

    data.components = body.components.map((c, i) => {
      const name = clean(c?.name, 100);
      const value = clean(c?.value, 200);
      if (!name || !value) {
        throw new HttpError(400, `Component ${i + 1} needs a name and a value.`);
      }
      const flag = c.flag || "normal";
      if (!FLAGS.includes(flag)) {
        throw new HttpError(400, `Component ${i + 1} has an invalid flag.`);
      }
      return {
        name,
        value,
        unit: clean(c.unit, 30),
        referenceLow: toNum(c.referenceLow),
        referenceHigh: toNum(c.referenceHigh),
        referenceRange: clean(c.referenceRange, 60),
        flag,
      };
    });
    data.flag = worstFlag(data.components.map((c) => c.flag));
  } else {
    data.result = clean(body.result, 5000);
    if (!data.result) throw new HttpError(400, "Please enter the test result value.");

    data.flag = body.flag || "normal";
    if (!FLAGS.includes(data.flag)) throw new HttpError(400, "Invalid interpretation flag.");

    if (resultType === "numeric") {
      data.unit = clean(body.unit, 30);
      data.referenceLow = toNum(body.referenceLow);
      data.referenceHigh = toNum(body.referenceHigh);
      data.referenceRange = clean(body.referenceRange, 60);
    }
  }

  return { data, consultationId };
}

export default async function handler(req, res) {
  const session = await verifySession(req, res);
  if (!session) return;

  const tenantId = session.clientId;
  const recordedBy = session.name || session.email || "System";

  if (!tenantId) {
    return res.status(400).json({
      error: "Missing facility tenant context in session.",
      message: "Missing facility tenant context in session.",
    });
  }

  if (ALLOWED_ROLES.length && !ALLOWED_ROLES.includes(session.role)) {
    return res.status(403).json({
      error: "You do not have permission to record lab results.",
      message: "You do not have permission to record lab results.",
    });
  }

  const facilityRef = firestore.collection("facility").doc(tenantId);
  const consultations = facilityRef.collection("consultations");
  const labResults = facilityRef.collection("labResults");

  const { method } = req;

  switch (method) {
    case "POST": {
      try {
        const { data, consultationId } = validatePayload(req.body);

        let consultRef;
        if (consultationId) {
          consultRef = consultations.doc(consultationId);
        } else {
          const directSnap = await consultations.doc(data.appointmentId).get();
          if (directSnap.exists) {
            consultRef = directSnap.ref;
          } else {
            const found = await consultations
              .where("appointmentId", "==", data.appointmentId)
              .limit(1)
              .get();
            if (found.empty) {
              throw new HttpError(404, "No consultation found for this appointment.");
            }
            consultRef = found.docs[0].ref;
          }
        }

        const resultRef = labResults.doc();

        await firestore.runTransaction(async (tx) => {
          const snap = await tx.get(consultRef);
          if (!snap.exists) throw new HttpError(404, "Consultation not found.");
          const consult = snap.data();

          if (consult.appointmentId && consult.appointmentId !== data.appointmentId) {
            throw new HttpError(400, "Appointment does not match this consultation.");
          }
          if (consult.clientId && consult.clientId !== data.clientId) {
            throw new HttpError(400, "Client does not match this consultation.");
          }

          const testNames = (Array.isArray(consult.tests) ? consult.tests : []).map((t) =>
            typeof t === "string" ? t : t?.name
          );
          if (!testNames.includes(data.testName)) {
            throw new HttpError(400, "This test was not requested on this consultation.");
          }

          const existing = consult.results?.[data.testName];
          if (existing?.status === "final" && data.status === "final") {
            throw new HttpError(
              409,
              "A final result is already recorded for this test. Submit it as corrected or amended."
            );
          }
          if ((data.status === "corrected" || data.status === "amended") && !existing) {
            throw new HttpError(400, "There is no existing result to correct or amend.");
          }

          tx.set(resultRef, {
            ...data,
            consultationId: consultRef.id,
            recordedBy,
            createdAt: FieldValue.serverTimestamp(),
          });

          const summary = {
            resultId: resultRef.id,
            resultType: data.resultType,
            status: data.status,
            flag: data.flag,
            testedAt: data.testedAt,
            recordedBy,
          };
          if (data.components) {
            summary.components = data.components;
          } else {
            summary.result = data.result;
            if (data.unit) summary.unit = data.unit;
          }

          const allDone = testNames.every(
            (n) => n === data.testName || Boolean(consult.results?.[n])
          );

          const updates = [
            new FieldPath("results", data.testName),
            summary,
            "updatedAt",
            FieldValue.serverTimestamp(),
          ];
          if (allDone) {
            updates.push(
              "labStatus",
              "completed",
              "labsCompleted",
              true,
              "labsCompletedAt",
              FieldValue.serverTimestamp()
            );
          }
          tx.update(consultRef, ...updates);
        });

        return res.status(201).json({
          message: `Result for ${data.testName} recorded successfully.`,
          id: resultRef.id,
        });
      } catch (error) {
        if (error instanceof HttpError) {
          return res.status(error.status).json({ error: error.message, message: error.message });
        }
        console.error("Error recording lab result:", error);
        return res.status(500).json({
          error: "Failed to record lab result",
          message: "Failed to record lab result",
        });
      }
    }

    case "GET": {
      try {
        const { appointmentId, clientId, consultationId } = req.query;

        let query = labResults;
        if (consultationId) query = query.where("consultationId", "==", String(consultationId));
        if (appointmentId) query = query.where("appointmentId", "==", String(appointmentId));
        if (clientId) query = query.where("clientId", "==", String(clientId));

        const hasFilter = consultationId || appointmentId || clientId;
        const snapshot = hasFilter
          ? await query.limit(200).get()
          : await query.orderBy("createdAt", "desc").limit(50).get();

        const records = snapshot.docs
          .map((doc) => {
            const row = doc.data();
            return {
              id: doc.id,
              ...row,
              createdAt: row.createdAt?.toDate?.().toISOString() ?? null,
            };
          })
          .sort((a, b) => String(b.testedAt || "").localeCompare(String(a.testedAt || "")));

        return res.status(200).json(records);
      } catch (error) {
        console.error("Error fetching lab results:", error);
        return res.status(500).json({
          error: "Failed to fetch lab results",
          message: "Failed to fetch lab results",
        });
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  }
}