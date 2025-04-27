import { db } from "../db";
import { trainingFeedback, trainingAttendees } from "../db/schema";
import { eq } from "drizzle-orm";

export async function createTrainingFeedback(data: {
  trainingId: number;
  userId: number;
  isEffective: boolean;
  trainingAidsGood: boolean;
  durationSufficient: boolean;
  contentExplained: boolean;
  conductedProperly: boolean;
  learningEnvironment: boolean;
  helpfulForWork: boolean;
  additionalTopics?: string;
  keyLearnings?: string;
  specialObservations?: string;
}) {
  try {
    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the feedback
      const [feedback] = await tx
        .insert(trainingFeedback)
        .values({
          trainingId: data.trainingId,
          userId: data.userId,
          isEffective: data.isEffective,
          trainingAidsGood: data.trainingAidsGood,
          durationSufficient: data.durationSufficient,
          contentExplained: data.contentExplained,
          conductedProperly: data.conductedProperly,
          learningEnvironment: data.learningEnvironment,
          helpfulForWork: data.helpfulForWork,
          additionalTopics: data.additionalTopics,
          keyLearnings: data.keyLearnings,
          specialObservations: data.specialObservations,
        })
        .returning();
      
      // Mark attendance as present
      await tx
        .insert(trainingAttendees)
        .values({
          trainingId: data.trainingId,
          userId: data.userId,
          attendanceStatus: 'present',
        })
        .onConflictDoUpdate({
          target: [trainingAttendees.trainingId, trainingAttendees.userId],
          set: { attendanceStatus: 'present' },
        });
      
      return feedback;
    });

    return result;
  } catch (error) {
    console.error("Error submitting training feedback:", error);
    throw error;
  }
} 