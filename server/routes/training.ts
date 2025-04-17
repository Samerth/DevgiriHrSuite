import { Router } from "express";
import { db } from "../db";
import { trainingAssessments, trainingAssessmentScores, trainingFeedback, trainingAttendees } from "../schema";
import { eq } from "drizzle-orm";
import { storage } from "../storage";

const router = Router();

// Get training assessments for a specific training
router.get("/training-assessments/:trainingId", async (req, res) => {
  try {
    const { trainingId } = req.params;
    const assessments = await db.query.trainingAssessments.findMany({
      where: eq(trainingAssessments.trainingId, parseInt(trainingId)),
      with: {
        user: true,
        assessor: true,
        scores: true,
      },
    });
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

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the assessment
      const [assessment] = await tx
        .insert(trainingAssessments)
        .values({
          trainingId,
          userId,
          assessorId,
          frequency,
          totalScore,
          status,
          comments,
        })
        .returning();

      // Create the assessment scores
      if (scores && Array.isArray(scores)) {
        await tx.insert(trainingAssessmentScores).values(
          scores.map((score) => ({
            assessmentId: assessment.id,
            parameterId: score.parameterId,
            score: score.score,
          }))
        );
      }

      return assessment;
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

// Submit training feedback and mark attendance
router.post("/training-feedback", async (req, res) => {
  try {
    console.log('Received feedback submission request:', req.body);
    const {
      trainingId,
      userId,
      isEffective,
      trainingAidsGood,
      durationSufficient,
      contentExplained,
      conductedProperly,
      learningEnvironment,
      helpfulForWork,
      additionalTopics,
      keyLearnings,
      specialObservations,
    } = req.body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      console.log('Starting transaction for feedback submission');
      
      // Create the feedback
      console.log('Inserting feedback with values:', {
        trainingId,
        userId,
        isEffective,
        trainingAidsGood,
        durationSufficient,
        contentExplained,
        conductedProperly,
        learningEnvironment,
        helpfulForWork,
        additionalTopics,
        keyLearnings,
        specialObservations,
      });

      const [feedback] = await tx
        .insert(trainingFeedback)
        .values({
          trainingId,
          userId,
          isEffective,
          trainingAidsGood,
          durationSufficient,
          contentExplained,
          conductedProperly,
          learningEnvironment,
          helpfulForWork,
          additionalTopics,
          keyLearnings,
          specialObservations,
        })
        .returning();

      console.log('Feedback inserted successfully:', feedback);

      // Mark attendance as present
      console.log('Marking attendance for user:', userId);
      
      await tx
        .insert(trainingAttendees)
        .values({
          trainingId,
          userId,
          attendanceStatus: 'present',
        })
        .onConflictDoUpdate({
          target: [trainingAttendees.trainingId, trainingAttendees.userId],
          set: { attendanceStatus: 'present' },
        });

      console.log('Attendance marked successfully');
      return feedback;
    });

    console.log('Transaction completed successfully:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error submitting training feedback:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to submit training feedback" });
  }
});

// Mark training attendance
router.post("/training-attendance/mark-present", async (req, res) => {
  try {
    console.log('Received attendance marking request:', req.body);
    const { trainingId, userId } = req.body;

    const result = await db
      .insert(trainingAttendees)
      .values({
        trainingId,
        userId,
        attendanceStatus: 'present',
      })
      .onConflictDoUpdate({
        target: [trainingAttendees.trainingId, trainingAttendees.userId],
        set: { attendanceStatus: 'present' },
      })
      .returning();

    console.log('Attendance marked successfully:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to mark attendance" });
  }
});

export default router; 