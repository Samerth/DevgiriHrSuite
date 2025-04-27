import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { ZodError } from "zod";

const router = Router();

// Get training assessments for a specific training
router.get("/training-assessments/:trainingId", async (req, res) => {
  try {
    const { trainingId } = req.params;
    const assessments = await storage.getTrainingAssessments(parseInt(trainingId));
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching training assessments:", error);
    res.status(500).json({ error: "Failed to fetch training assessments" });
  }
});

// Create a new training assessment
router.post("/training-assessments", async (req, res) => {
  try {
    const {
      trainingId,
      userId,
      assessorId,
      frequency,
      totalScore,
      status,
      comments,
      scores,
    } = req.body;

    const result = await storage.createTrainingAssessment({
      trainingId,
      userId,
      assessorId,
      assessmentDate: new Date().toISOString().split('T')[0],
      frequency,
      totalScore,
      status,
      comments,
      scores,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating training assessment:", error);
    res.status(500).json({ error: "Failed to create training assessment" });
  }
});

// Get training feedback for a specific training
router.get("/training-feedback/:trainingId", async (req, res) => {
  try {
    const { trainingId } = req.params;
    const feedback = await storage.getTrainingFeedback(parseInt(trainingId));
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching training feedback:", error);
    res.status(500).json({ error: "Failed to fetch training feedback" });
  }
});

// Public route to get training details for feedback
router.get("/training-records/:id/feedback", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = await storage.getTrainingRecord(id);
    
    if (!record) {
      return res.status(404).json({ error: "Training record not found" });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching training record:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch training record" });
  }
});

// Public route to submit training feedback
router.post("/training-feedback", async (req, res) => {
  try {
    console.log('Received feedback submission request:', req.body);
    
    // Validate the request data
    const schema = z.object({
      trainingId: z.number(),
      userId: z.number(),
      isEffective: z.boolean(),
      trainingAidsGood: z.boolean(),
      durationSufficient: z.boolean(),
      contentExplained: z.boolean(),
      conductedProperly: z.boolean(),
      learningEnvironment: z.boolean(),
      helpfulForWork: z.boolean(),
      additionalTopics: z.string().optional(),
      keyLearnings: z.string().optional(),
      specialObservations: z.string().optional(),
    });

    const validatedData = schema.parse(req.body);
    
    // Start a transaction
    const result = await storage.submitTrainingFeedback(validatedData);

    console.log('Transaction completed successfully:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error submitting training feedback:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to submit training feedback" });
  }
});

// Mark training attendance
router.post("/training-attendance/mark-present", async (req, res) => {
  try {
    console.log('Received attendance marking request:', req.body);
    const { trainingId, userId } = req.body;

    const result = await storage.markTrainingAttendance(trainingId, userId);
    console.log('Attendance marked successfully:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to mark attendance" });
  }
});

// Get a specific training record
router.get("/training-records/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = await storage.getTrainingRecord(id);
    
    if (!record) {
      return res.status(404).json({ error: "Training record not found" });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching training record:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch training record" });
  }
});

export default router; 