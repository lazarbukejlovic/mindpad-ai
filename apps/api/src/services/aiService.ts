import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

interface OrganizeResult {
  summary: string;
  tasks: string[];
  priorities: string[];
  focusRecommendation: string;
  reasoning: string;
}

interface MorningBriefResult {
  briefText: string;
  topPriority: string;
  suggestedFocusTime: number;
  keyThemesText: string;
}

interface EveningSummaryResult {
  summary: string;
  accomplishments: string[];
  lessonsLearned: string[];
  tomorrowPreview: string;
}

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function extractJson(text: string): string | null {
  const stripped = stripCodeFence(text);
  const match = stripped.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function normalizeClause(clause: string): string {
  let text = clause
    .replace(/\s+/g, ' ')
    .replace(/^(?:first|then|next|also|finally|after that)\b[,\s]*/i, '')
    .replace(/^I\s+need\s+to\s+/i, '')
    .replace(/^(?:need|needs)\s+to\s+/i, '')
    .replace(/^(?:you\s+should|we\s+should|should)\s+/i, '')
    .replace(/^please\s+/i, '')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[.!?]+$/, '')
    .trim();
  // Strip dangling connector words at end (incomplete split artifact)
  text = text.replace(/\s+(?:to|and|the|with|for|after|before|or|but|so|then|first|a|an)$/i, '').trim();
  if (!text || !/^[a-zA-Z]/i.test(text)) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractTasksLocal(content: string): string[] {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned];
  const tasks: string[] = [];

  for (const rawSentence of sentences) {
    const clauses = rawSentence
      .replace(/[.!?]+$/, '')
      .trim()
      .split(/,\s*(?:and\s+)?|;\s*/)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const clause of clauses) {
      const normalized = normalizeClause(clause);
      if (!normalized || normalized.length < 4) continue;
      if (tasks.some((t) => t.toLowerCase() === normalized.toLowerCase())) continue;
      tasks.push(normalized);
      if (tasks.length >= 6) break;
    }
    if (tasks.length >= 6) break;
  }

  if (tasks.length === 0) {
    // Last-resort: newline or semicolon split
    const parts = content.split(/[\n;]+/).map((p) => normalizeClause(p)).filter(Boolean);
    for (const p of parts) {
      if (!tasks.includes(p)) tasks.push(p);
      if (tasks.length >= 6) break;
    }
  }

  return tasks;
}

function getRealisticFallback(brainDump: string): OrganizeResult {
  const tasks = extractTasksLocal(brainDump);
  const defaultTasks = [
    'Review and prioritize main objectives',
    'Break down complex tasks into steps',
    'Schedule focused work blocks',
  ];
  const finalTasks = tasks.length > 0 ? tasks : defaultTasks;

  const priorities = finalTasks.map((task) => {
    if (/urgent|asap|today|deadline|client|prod|critical|fix|emergency/i.test(task)) return 'High';
    if (/review|test|verify|check|confirm/i.test(task)) return 'Medium';
    return 'Medium';
  });

  return {
    summary:
      tasks.length > 0
        ? `You've outlined ${tasks.length} actionable task${tasks.length !== 1 ? 's' : ''}. Starting with the highest-priority item is recommended.`
        : 'Your notes contain several interconnected thoughts. Focus on the most urgent items first.',
    tasks: finalTasks,
    priorities,
    focusRecommendation:
      finalTasks.length > 0
        ? `Start with: ${finalTasks[0]}`
        : 'Start with the most time-sensitive or impactful task.',
    reasoning:
      'Sentence-based extraction fallback. Add a GEMINI_API_KEY to apps/api/.env for AI-powered extraction.',
  };
}

function getGeminiClient() {
  return new GoogleGenerativeAI(config.geminiApiKey);
}

export async function organizeWithAI(brainDump: string): Promise<OrganizeResult> {
  if (!config.geminiApiKey) {
    return getRealisticFallback(brainDump);
  }

  try {
    const genAI = getGeminiClient();
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `You are a productivity coach helping organize scattered thoughts into actionable tasks.

Given this brain dump:
"""
${brainDump}
"""

Respond with a JSON object containing:
1. "summary": A brief understanding of what the user is trying to accomplish
2. "tasks": Array of 3-5 specific, actionable tasks extracted from the dump
3. "priorities": Array of priority levels (High/Medium/Low) matching the tasks
4. "focusRecommendation": The single most important task to focus on first
5. "reasoning": Brief explanation of why you prioritized this way

Return ONLY valid JSON, no markdown fences.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = extractJson(responseText);

    if (!jsonStr) return getRealisticFallback(brainDump);

    const parsed = JSON.parse(jsonStr) as OrganizeResult;

    if (
      !parsed.summary ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.priorities) ||
      !parsed.focusRecommendation ||
      !parsed.reasoning
    ) {
      return getRealisticFallback(brainDump);
    }

    return parsed;
  } catch (error) {
    console.error('AI service error:', error);
    return getRealisticFallback(brainDump);
  }
}

export async function generateMorningBrief(userContext: string): Promise<MorningBriefResult> {
  const fallback: MorningBriefResult = {
    briefText:
      'Welcome back! Focus on your highest-priority task first, then tackle secondary items. Break your day into focused blocks with short breaks in between.',
    topPriority: userContext || 'Review your main objectives for today',
    suggestedFocusTime: 90,
    keyThemesText:
      'Productivity, focused work, achieving key goals. Consider your energy levels and schedule breaks accordingly.',
  };

  if (!config.geminiApiKey) return fallback;

  try {
    const genAI = getGeminiClient();
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `Create a brief morning productivity brief based on this context:
${userContext || 'General productivity advice'}

Return JSON with:
- briefText: Motivating morning message (1-2 sentences)
- topPriority: Main focus for today
- suggestedFocusTime: Minutes for first focus block (60-120)
- keyThemesText: Key themes to keep in mind

Return ONLY valid JSON, no markdown fences.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = extractJson(responseText);

    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as MorningBriefResult;
    return {
      briefText: parsed.briefText || fallback.briefText,
      topPriority: parsed.topPriority || fallback.topPriority,
      suggestedFocusTime: parsed.suggestedFocusTime || 90,
      keyThemesText: parsed.keyThemesText || fallback.keyThemesText,
    };
  } catch (error) {
    console.error('Morning brief generation error:', error);
    return fallback;
  }
}

export async function generateEveningSummary(accomplishments: string[]): Promise<EveningSummaryResult> {
  const fallback: EveningSummaryResult = {
    summary:
      accomplishments.length > 0
        ? `You completed ${accomplishments.length} tasks today. Great progress!`
        : 'Today was a productive day. Every step forward counts.',
    accomplishments:
      accomplishments.length > 0 ? accomplishments : ['Made progress on key objectives'],
    lessonsLearned: [
      'Focus works best in dedicated blocks',
      'Prioritization saves time and energy',
    ],
    tomorrowPreview: 'Start fresh tomorrow with the top 3 priorities. Rest well tonight.',
  };

  if (!config.geminiApiKey) return fallback;

  try {
    const genAI = getGeminiClient();
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const accomplishmentList =
      accomplishments.length > 0
        ? accomplishments.join('\n- ')
        : 'Made progress throughout the day';

    const prompt = `Create an evening summary based on these accomplishments:
- ${accomplishmentList}

Return JSON with:
- summary: Overall reflection (1-2 sentences)
- accomplishments: Array of key wins
- lessonsLearned: Array of insights (2-3)
- tomorrowPreview: One-line tomorrow preview

Return ONLY valid JSON, no markdown fences.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = extractJson(responseText);

    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as EveningSummaryResult;
    return {
      summary: parsed.summary || fallback.summary,
      accomplishments: Array.isArray(parsed.accomplishments)
        ? parsed.accomplishments
        : accomplishments.length > 0 ? accomplishments : fallback.accomplishments,
      lessonsLearned: Array.isArray(parsed.lessonsLearned)
        ? parsed.lessonsLearned
        : fallback.lessonsLearned,
      tomorrowPreview: parsed.tomorrowPreview || fallback.tomorrowPreview,
    };
  } catch (error) {
    console.error('Evening summary generation error:', error);
    return fallback;
  }
}
