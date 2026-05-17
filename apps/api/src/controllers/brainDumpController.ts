import { BrainDump } from '../models/BrainDump';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';
import { organizeWithAI } from '../services/aiService';
import { z } from 'zod';

const CreateBrainDumpSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

const OrganizeBrainDumpSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export async function createBrainDump(userId: string, content: string) {
  if (isMongoConnected()) {
    const brainDump = new BrainDump({
      userId,
      content,
      organized: false,
    });
    await brainDump.save();
    return {
      id: brainDump._id.toString(),
      content: brainDump.content,
      organized: brainDump.organized,
      createdAt: brainDump.createdAt,
    };
  } else {
    const id = randomUUID();
    memoryStore.saveBrainDump({
      id,
      userId,
      content,
      createdAt: new Date(),
    });
    return {
      id,
      content,
      organized: false,
      createdAt: new Date(),
    };
  }
}

export async function getBrainDumps(userId: string) {
  if (isMongoConnected()) {
    const brainDumps = await BrainDump.find({ userId })
      .sort({ createdAt: -1 });
    return brainDumps.map((bd) => ({
      id: bd._id.toString(),
      content: bd.content,
      summary: bd.summary,
      suggestedTasks: bd.suggestedTasks,
      organized: bd.organized,
      createdAt: bd.createdAt,
    }));
  } else {
    const brainDumps = memoryStore.getBrainDumpsByUserId(userId);
    return brainDumps.map((bd) => ({
      id: bd.id,
      content: bd.content,
      summary: bd.summary,
      suggestedTasks: bd.suggestedTasks,
      organized: !!bd.summary,
      createdAt: bd.createdAt,
    }));
  }
}

export async function organizeBrainDump(userId: string, content: string) {
  // Validate input
  const validated = OrganizeBrainDumpSchema.parse({ content });

  // Get AI organization
  const result = await organizeWithAI(validated.content);

  if (isMongoConnected()) {
    // Save organized dump to DB
    const brainDump = new BrainDump({
      userId,
      content: validated.content,
      summary: result.summary,
      suggestedTasks: result.tasks,
      organized: true,
    });
    await brainDump.save();

    return {
      id: brainDump._id.toString(),
      summary: result.summary,
      tasks: result.tasks,
      priorities: result.priorities,
      focusRecommendation: result.focusRecommendation,
      reasoning: result.reasoning,
    };
  } else {
    const id = randomUUID();
    memoryStore.saveBrainDump({
      id,
      userId,
      content: validated.content,
      summary: result.summary,
      suggestedTasks: result.tasks,
      createdAt: new Date(),
    });

    return {
      id,
      summary: result.summary,
      tasks: result.tasks,
      priorities: result.priorities,
      focusRecommendation: result.focusRecommendation,
      reasoning: result.reasoning,
    };
  }
}
