import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface OrganizeResult {
  summary: string;
  tasks: string[];
  priorities: string[];
  categories: string[];
  estimatedMinutes: number[];
  focusRecommendation: string;
  reasoning: string;
  dailyPlanSuggestion?: string;
  mode: 'ai' | 'offline';
}

interface MorningBriefResult {
  mainPriority: string;
  topActions: string[];
  suggestedFocusBlock: string;
  warning: string;
  message: string;
  mode: 'ai' | 'offline';
}

interface EveningSummaryResult {
  summary: string;
  accomplishments: string[];
  unfinished: string[];
  tomorrowPriority: string;
  improvement: string;
  mode: 'ai' | 'offline';
}

export interface AskResult {
  answer: string;
  sections: Array<{ title: string; content: string }>;
  suggestedActions: string[];
  mode: 'ai' | 'offline';
}

export interface FocusRecommendation {
  suggestedTask: string | null;
  why: string;
  sessionLength: number;
  firstStep: string;
  warning: string | null;
  mode: 'ai' | 'offline';
}

export interface TaskCleanupResult {
  nextAction: string;
  highPriority: string[];
  vague: string[];
  recommendation: string;
  mode: 'ai' | 'offline';
}

export interface NextBestActionResult {
  recommendedAction: string;
  whyThisMatters: string;
  firstStep: string;
  estimatedFocusTime: number;
  riskIfIgnored: string;
  relatedTasks: string[];
  confidenceLabel: 'low' | 'medium' | 'high';
  mode: 'ai' | 'offline';
}

export interface PriorityBriefResult {
  topPriority: string;
  secondaryPriority: string;
  quickWin: string;
  avoidForNow: string;
  reasoning: string;
  suggestedFocusSession: string;
  mode: 'ai' | 'offline';
}

export interface BlockerAnalysisItem {
  blocker: string;
  evidence: string;
  impact: string;
  nextAction: string;
  suggestedFocusWindow: string;
}

export interface BlockerAnalysisResult {
  blockers: BlockerAnalysisItem[];
  overallStatus: string;
  mode: 'ai' | 'offline';
}

type FailureReason =
  | 'missing_key'
  | 'invalid_key_or_auth'
  | 'quota_or_billing'
  | 'model_unavailable'
  | 'network_error'
  | 'timeout'
  | 'bad_request'
  | 'unknown';

export interface AIStatusResult {
  configured: boolean;
  available: boolean;
  mode: 'ai' | 'offline';
  reason?: FailureReason;
}

// â”€â”€â”€ Availability Cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Updated by every real callAI() invocation, and by getAIStatus() test calls.
// Source of truth for whether the AI is actually working right now.

let cachedAvailable: boolean | null = null;
let cacheTimestamp = 0;
const STATUS_CACHE_TTL = 60_000; // 1 minute

// â”€â”€â”€ Dev Logging + Error Categorization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getHttpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

function categorizeError(err: unknown): FailureReason {
  const status = getHttpStatus(err);
  if (status !== undefined) {
    if (status === 400) return 'bad_request';
    if (status === 401 || status === 403) {
      const msg = (err instanceof Error ? err.message : '').toLowerCase();
      return msg.includes('quota') || msg.includes('billing') ? 'quota_or_billing' : 'invalid_key_or_auth';
    }
    if (status === 404) return 'model_unavailable';
    if (status === 429) return 'quota_or_billing';
    if (status >= 500) return 'network_error';
  }
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('request_timeout') || msg.includes('timed out')) return 'timeout';
  if (msg.includes('abort')) return 'timeout';
  if (msg.includes('404') || msg.includes('not found') || msg.includes('models/')) return 'model_unavailable';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('billing')) return 'quota_or_billing';
  if (msg.includes('401') || msg.includes('403') || msg.includes('invalid api key') || msg.includes('api_key') || msg.includes('invalid_argument')) return 'invalid_key_or_auth';
  if (msg.includes('fetch') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('network')) return 'network_error';
  return 'unknown';
}

function devLog(
  configured: boolean,
  available: boolean,
  mode: 'ai' | 'offline',
  opts?: { reason?: FailureReason; model?: string; status?: number }
): void {
  if (process.env.NODE_ENV === 'production') return;
  console.log(`[MindPad AI] configured: ${configured}`);
  if (opts?.model) console.log(`[MindPad AI] model attempted: ${opts.model}`);
  if (opts?.status) console.log(`[MindPad AI] http status: ${opts.status}`);
  console.log(`[MindPad AI] request success: ${available}`);
  console.log(`[MindPad AI] mode: ${mode}`);
  if (opts?.reason) console.log(`[MindPad AI] failure category: ${opts.reason}`);
}

// â”€â”€â”€ Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Does NOT only check key existence. Makes a real lightweight test call and
// caches the result. Subsequent checks within STATUS_CACHE_TTL use the cache
// (which is also updated by every feature callAI() call).

export async function getAIStatus(): Promise<AIStatusResult> {
  const configured = Boolean(config.geminiApiKey);
  if (!configured) {
    return { configured: false, available: false, mode: 'offline', reason: 'missing_key' };
  }

  const now = Date.now();
  if (cachedAvailable !== null && now - cacheTimestamp < STATUS_CACHE_TTL) {
    const available = cachedAvailable;
    const result: AIStatusResult = {
      configured: true,
      available,
      mode: available ? 'ai' : 'offline',
      ...(available ? {} : { reason: 'unknown' as FailureReason }),
    };
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] status (cached) â†’ mode: ${result.mode}`);
    }
    return result;
  }

  // Real test call â€” primary model, hard timeout so the endpoint stays fast
  const TEST_MODEL = 'gemini-2.0-flash';
  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: TEST_MODEL });

    const testCall = model.generateContent('Reply with exactly: ok');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('request_timeout')), 8_000)
    );

    await Promise.race([testCall, timeoutPromise]);

    cachedAvailable = true;
    cacheTimestamp = Date.now();
    devLog(true, true, 'ai', { model: TEST_MODEL });
    return { configured: true, available: true, mode: 'ai' };
  } catch (err) {
    const reason = categorizeError(err);
    const status = getHttpStatus(err);
    cachedAvailable = false;
    cacheTimestamp = Date.now();
    devLog(true, false, 'offline', { reason, model: TEST_MODEL, status });
    return { configured: true, available: false, mode: 'offline', reason };
  }
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      .replace(/[.!?]+$/, '').trim()
      .split(/,\s*(?:and\s+)?|;\s*/).map((c) => c.trim()).filter(Boolean);
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
    const parts = content.split(/[\n;]+/).map((p) => normalizeClause(p)).filter(Boolean);
    for (const p of parts) {
      if (!tasks.includes(p)) tasks.push(p);
      if (tasks.length >= 6) break;
    }
  }
  return tasks;
}

// Core AI wrapper â€” tries models in sequence, updates availability cache.
// Model list uses currently available Gemini models for v1beta API.
const AI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callAI(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  let lastError: unknown;
  for (const modelName of AI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      cachedAvailable = true;
      cacheTimestamp = Date.now();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[MindPad AI] model ${modelName}: success`);
      }
      return text;
    } catch (err) {
      lastError = err;
      if (process.env.NODE_ENV !== 'production') {
        const reason = categorizeError(err);
        const status = getHttpStatus(err);
        console.log(`[MindPad AI] model ${modelName} failed: ${reason}${status ? ` (HTTP ${status})` : ''}`);
      }
    }
  }
  cachedAvailable = false;
  cacheTimestamp = Date.now();
  throw lastError;
}

// â”€â”€â”€ Brain Dump Organize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getOrganizeFallback(brainDump: string): OrganizeResult {
  const tasks = extractTasksLocal(brainDump);
  const defaultTasks = [
    'Review and prioritize main objectives',
    'Break down complex tasks into steps',
    'Schedule focused work blocks',
  ];
  const finalTasks = tasks.length > 0 ? tasks : defaultTasks;
  const priorities = finalTasks.map((task) =>
    /urgent|asap|today|deadline|client|prod|critical|fix|emergency/i.test(task) ? 'High' : 'Medium'
  );

  return {
    summary: tasks.length > 0
      ? `Extracted ${tasks.length} actionable task${tasks.length !== 1 ? 's' : ''} from your notes.`
      : 'Your notes contain several interconnected thoughts. Focus on the most urgent items first.',
    tasks: finalTasks,
    priorities,
    categories: finalTasks.map(() => 'General'),
    estimatedMinutes: finalTasks.map(() => 25),
    focusRecommendation: finalTasks.length > 0 ? `Start with: ${finalTasks[0]}` : 'Start with the most time-sensitive task.',
    reasoning: tasks.length > 0
      ? 'Extracted using sentence analysis. Enable AI for smarter prioritization.'
      : 'Using default tasks. Write more details for better extraction.',
    mode: 'offline',
  };
}

export async function organizeWithAI(brainDump: string): Promise<OrganizeResult> {
  if (!config.geminiApiKey) return getOrganizeFallback(brainDump);

  try {
    const prompt = `You are MindPad AI â€” a personal execution assistant specialized in turning scattered thoughts into clear action plans.

Given this brain dump:
"""
${brainDump}
"""

Extract actionable tasks and produce a structured execution plan. Respond with a JSON object:
{
  "summary": "2-3 sentences: what the user is trying to accomplish and the key challenge",
  "tasks": ["3-6 specific, actionable task titles"],
  "priorities": ["High/Medium/Low for each task"],
  "categories": ["category for each task: Work / Personal / Learning / Health / Admin / Creative"],
  "estimatedMinutes": [25, 50, 25, ...estimated focus minutes per task],
  "focusRecommendation": "The single task to focus on first and why â€” 1 sentence",
  "reasoning": "Brief explanation of your prioritization logic",
  "dailyPlanSuggestion": "Optional: a simple 3-step plan for today based on the tasks"
}

Return ONLY valid JSON, no markdown fences. Be concise and execution-focused.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return getOrganizeFallback(brainDump);

    const parsed = JSON.parse(jsonStr) as OrganizeResult;
    if (!parsed.summary || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
      return getOrganizeFallback(brainDump);
    }

    return {
      summary: parsed.summary,
      tasks: parsed.tasks,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities : parsed.tasks.map(() => 'Medium'),
      categories: Array.isArray(parsed.categories) ? parsed.categories : parsed.tasks.map(() => 'General'),
      estimatedMinutes: Array.isArray(parsed.estimatedMinutes) ? parsed.estimatedMinutes : parsed.tasks.map(() => 25),
      focusRecommendation: parsed.focusRecommendation || `Start with: ${parsed.tasks[0]}`,
      reasoning: parsed.reasoning || '',
      dailyPlanSuggestion: parsed.dailyPlanSuggestion,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] organize failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return getOrganizeFallback(brainDump);
  }
}

// â”€â”€â”€ Morning Brief â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface WorkspaceContext {
  activeTasks: Array<{ title: string; priority: string }>;
  completedToday: number;
  totalFocusMinutes: number;
  completedSessions: number;
  recentNotes: string[];
}

export async function generateMorningBrief(context: string | WorkspaceContext): Promise<MorningBriefResult> {
  const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
  const fallback = buildMorningBriefFallback(context);
  if (!config.geminiApiKey) return fallback;

  try {
    const prompt = `You are MindPad AI â€” a personal execution assistant. Generate a concise, actionable morning brief.

User workspace context:
${contextStr}

Respond with a JSON object:
{
  "mainPriority": "The single most important thing to accomplish today â€” be specific",
  "topActions": ["Action 1", "Action 2", "Action 3"],
  "suggestedFocusBlock": "Specific recommendation like: Start with a 25-minute session on X, then take a 5-minute break",
  "warning": "Optional warning if task list is overloaded, unclear, or has blockers â€” or empty string",
  "message": "One short, practical motivational sentence â€” no fluff"
}

Be specific to the user's actual tasks. No generic advice. Return ONLY valid JSON.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as MorningBriefResult;
    return {
      mainPriority: parsed.mainPriority || fallback.mainPriority,
      topActions: Array.isArray(parsed.topActions) ? parsed.topActions : fallback.topActions,
      suggestedFocusBlock: parsed.suggestedFocusBlock || fallback.suggestedFocusBlock,
      warning: parsed.warning || '',
      message: parsed.message || fallback.message,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] morning-brief failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return fallback;
  }
}

function buildMorningBriefFallback(context: string | WorkspaceContext): MorningBriefResult {
  if (typeof context === 'object' && context.activeTasks?.length > 0) {
    const highPriority = context.activeTasks.filter(t => t.priority === 'high');
    const topTask = highPriority[0] || context.activeTasks[0];
    return {
      mainPriority: topTask.title,
      topActions: context.activeTasks.slice(0, 3).map(t => t.title),
      suggestedFocusBlock: `Start with a 25-minute focused session on "${topTask.title}"`,
      warning: context.activeTasks.length > 8 ? 'You have many active tasks - consider focusing on just 3 today.' : '',
      message: 'One focused hour beats a scattered day. Start with the highest-leverage task.',
      mode: 'offline',
    };
  }
  return {
    mainPriority: 'Review your active tasks and pick the most important one',
    topActions: ['Create your first brain dump', 'Add your top 3 tasks', 'Start a 25-minute focus session'],
    suggestedFocusBlock: 'Start with a 25-minute session on your most important task',
    warning: '',
    message: 'Clarity beats hustle. Start by picking one thing.',
    mode: 'offline',
  };
}

// â”€â”€â”€ Evening Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function generateEveningSummary(accomplishments: string[], context?: WorkspaceContext): Promise<EveningSummaryResult> {
  const fallback: EveningSummaryResult = {
    summary: accomplishments.length > 0
      ? `You completed ${accomplishments.length} task${accomplishments.length !== 1 ? 's' : ''} today. Solid progress.`
      : 'No tasks completed today, but every day is a fresh start.',
    accomplishments: accomplishments.length > 0 ? accomplishments : [],
    unfinished: context?.activeTasks?.slice(0, 3).map(t => t.title) ?? [],
    tomorrowPriority: context?.activeTasks?.[0]?.title ?? 'Review your task list and pick a top priority',
    improvement: 'Try to start tomorrow with a single clear priority.',
    mode: 'offline',
  };

  if (!config.geminiApiKey) return fallback;

  try {
    const contextStr = context ? JSON.stringify(context) : '';
    const prompt = `You are MindPad AI. Generate a concise evening summary for a user's workday.

Completed tasks today:
${accomplishments.length > 0 ? accomplishments.map(a => `- ${a}`).join('\n') : '(none)'}

${contextStr ? `Remaining workspace context:\n${contextStr}` : ''}

Respond with a JSON object:
{
  "summary": "2-sentence reflection on the day â€” honest, not generic",
  "accomplishments": ["specific wins or progress made"],
  "unfinished": ["top 2-3 unfinished items to carry forward"],
  "tomorrowPriority": "The single most important thing for tomorrow",
  "improvement": "One specific, actionable improvement suggestion for tomorrow"
}

Be direct and specific. Return ONLY valid JSON.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as EveningSummaryResult;
    return {
      summary: parsed.summary || fallback.summary,
      accomplishments: Array.isArray(parsed.accomplishments) ? parsed.accomplishments : fallback.accomplishments,
      unfinished: Array.isArray(parsed.unfinished) ? parsed.unfinished : fallback.unfinished,
      tomorrowPriority: parsed.tomorrowPriority || fallback.tomorrowPriority,
      improvement: parsed.improvement || fallback.improvement,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] evening-summary failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return fallback;
  }
}

// â”€â”€â”€ Ask MindPad AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function askMindPadAI(question: string, context: WorkspaceContext): Promise<AskResult> {
  const contextSummary = buildContextSummary(context);
  const fallback = buildAskFallback(question, context);
  if (!config.geminiApiKey) return fallback;

  try {
    const prompt = `You are MindPad AI â€” a specialized personal execution assistant. You help users turn mental chaos into clear priorities, realistic next actions, and focused execution plans.

User's workspace context:
${contextSummary}

User question: "${question}"

Answer with a JSON object:
{
  "answer": "Direct, specific 1-3 sentence answer to the user's question",
  "sections": [
    { "title": "Section title", "content": "Specific content related to the user's actual tasks and context" }
  ],
  "suggestedActions": ["Specific action 1", "Specific action 2"]
}

Rules:
- Be specific to the user's actual tasks â€” no generic advice
- Focus on execution, prioritization, and clarity
- Keep each section under 3 sentences
- 2-4 sections total, each relevant to the question
- No fluff, no generic productivity tips
- If the user has no tasks yet, guide them to create a brain dump first
- Never mention AI provider names

Return ONLY valid JSON.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as AskResult;
    return {
      answer: parsed.answer || fallback.answer,
      sections: Array.isArray(parsed.sections) ? parsed.sections : fallback.sections,
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : fallback.suggestedActions,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] ask failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return fallback;
  }
}

function buildContextSummary(ctx: WorkspaceContext): string {
  const lines: string[] = [];
  if (ctx.activeTasks.length > 0) {
    lines.push(`Active tasks (${ctx.activeTasks.length}):`);
    ctx.activeTasks.slice(0, 8).forEach(t => lines.push(`  - [${t.priority}] ${t.title}`));
  } else {
    lines.push('Active tasks: none');
  }
  if (ctx.completedToday > 0) lines.push(`Completed today: ${ctx.completedToday}`);
  if (ctx.totalFocusMinutes > 0) lines.push(`Total focus time: ${ctx.totalFocusMinutes} min across ${ctx.completedSessions} sessions`);
  if (ctx.recentNotes.length > 0) {
    lines.push('Recent notes/brain dumps:');
    ctx.recentNotes.slice(0, 2).forEach(n => lines.push(`  - "${n.slice(0, 120)}"`));
  }
  return lines.join('\n') || 'No workspace data yet.';
}

function buildAskFallback(question: string, context: WorkspaceContext): AskResult {
  const q = question.toLowerCase();
  const hasNoTasks = context.activeTasks.length === 0;
  const topTask = context.activeTasks[0];
  const highPriority = context.activeTasks.filter(t => t.priority === 'high');

  if (hasNoTasks) {
    return {
      answer: 'Your workspace is empty. Start by writing a brain dump to capture your thoughts, then let MindPad AI extract tasks and priorities.',
      sections: [
        { title: 'First Step', content: 'Go to Brain Dump and write everything on your mind: tasks, ideas, worries. MindPad AI will organize it.' },
        { title: 'Why This Helps', content: 'Externalizing your mental load is the first step to clarity. Once tasks are extracted, MindPad AI can guide your priorities.' },
      ],
      suggestedActions: ['Open Brain Dump', 'Write your first brain dump'],
      mode: 'offline',
    };
  }

  if (q.includes('focus') || q.includes('start') || q.includes('first')) {
    const task = highPriority[0] || topTask;
    return {
      answer: `Focus on “${task.title}” first - it has the highest priority in your list.`,
      sections: [
        { title: 'Recommended Focus', content: `"${task.title}" should be your starting point. It is marked ${task.priority} priority.` },
        { title: 'Session Suggestion', content: 'Start with a 25-minute focused session. Silence notifications and work on only this task.' },
        { title: 'Smallest Next Step', content: 'Break this task into one concrete action you can complete in under 10 minutes to build momentum.' },
      ],
      suggestedActions: [`Start a 25-min session on "${task.title}"`, 'Remove distractions first'],
      mode: 'offline',
    };
  }

  return {
    answer: `You have ${context.activeTasks.length} active tasks. Here's how MindPad AI reads your current workload.`,
    sections: [
      { title: 'Top Priority', content: topTask ? `”${topTask.title}” - ${topTask.priority} priority` : 'No high-priority tasks found.' },
      { title: 'Recommendation', content: highPriority.length > 3 ? 'You have multiple high-priority tasks. Consider focusing on just one per session.' : 'Your workload looks manageable. Pick one task and go deep.' },
    ],
    suggestedActions: [`Focus on "${topTask?.title ?? 'your top task'}"`, 'Start a 25-min session'],
    mode: 'offline',
  };
}

// â”€â”€â”€ Focus Recommendation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getFocusRecommendation(context: WorkspaceContext): Promise<FocusRecommendation> {
  const fallback = buildFocusFallback(context);
  if (!config.geminiApiKey) return fallback;

  try {
    const contextSummary = buildContextSummary(context);
    const prompt = `You are MindPad AI. The user is about to start a focus session. Recommend what to work on.

Workspace context:
${contextSummary}

Respond with a JSON object:
{
  "suggestedTask": "The exact task title to focus on, or null if no tasks exist",
  "why": "1-2 sentences: why this task is the right focus right now",
  "sessionLength": 25,
  "firstStep": "The single smallest first action to do inside this session",
  "warning": "Optional: warning if the task is vague, too large for one session, or if the user is overloaded â€” or null"
}

Be specific. Use the exact task title. Return ONLY valid JSON.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as FocusRecommendation;
    return {
      suggestedTask: parsed.suggestedTask || null,
      why: parsed.why || fallback.why,
      sessionLength: typeof parsed.sessionLength === 'number' ? parsed.sessionLength : 25,
      firstStep: parsed.firstStep || fallback.firstStep,
      warning: parsed.warning || null,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] focus-recommendation failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return fallback;
  }
}

function buildFocusFallback(context: WorkspaceContext): FocusRecommendation {
  const highPriority = context.activeTasks.filter(t => t.priority === 'high');
  const topTask = highPriority[0] || context.activeTasks[0];

  if (!topTask) {
    return {
      suggestedTask: null,
      why: 'No active tasks found. Consider creating a brain dump to generate tasks first.',
      sessionLength: 25,
      firstStep: 'Open Brain Dump and write your current priorities.',
      warning: null,
      mode: 'offline',
    };
  }

  return {
    suggestedTask: topTask.title,
    why: `This is your ${topTask.priority}-priority task and likely the highest-leverage work right now.`,
    sessionLength: 25,
    firstStep: `Open your notes or tools for "${topTask.title}" and identify the first concrete action.`,
    warning: topTask.title.split(' ').length < 4 ? 'This task title is quite short. Make sure you know exactly what you need to do before starting.' : null,
    mode: 'offline',
  };
}

// â”€â”€â”€ Task Cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function analyzeTaskList(tasks: Array<{ title: string; priority: string; completed: boolean }>): Promise<TaskCleanupResult> {
  const activeTasks = tasks.filter(t => !t.completed);
  const fallback = buildTaskCleanupFallback(activeTasks);
  if (!config.geminiApiKey || activeTasks.length === 0) return fallback;

  try {
    const taskList = activeTasks.map(t => `[${t.priority}] ${t.title}`).join('\n');
    const prompt = `You are MindPad AI. Analyze this task list and identify what to do next, what is vague, and give a clear recommendation.

Active tasks:
${taskList}

Respond with a JSON object:
{
  "nextAction": "The exact title of the single task to work on right now â€” be decisive",
  "highPriority": ["task titles that are genuinely high-leverage or urgent"],
  "vague": ["task titles that are too vague or broad to execute directly"],
  "recommendation": "2-3 sentences of practical advice: what to focus on, what to clean up, any patterns you notice"
}

Return ONLY valid JSON.`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as TaskCleanupResult;
    return {
      nextAction: parsed.nextAction || fallback.nextAction,
      highPriority: Array.isArray(parsed.highPriority) ? parsed.highPriority : fallback.highPriority,
      vague: Array.isArray(parsed.vague) ? parsed.vague : [],
      recommendation: parsed.recommendation || fallback.recommendation,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] task-cleanup failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ""}`);
    }
    return fallback;
  }
}

function buildTaskCleanupFallback(activeTasks: Array<{ title: string; priority: string; completed: boolean }>): TaskCleanupResult {
  if (activeTasks.length === 0) {
    return {
      nextAction: 'Create your first task',
      highPriority: [],
      vague: [],
      recommendation: 'No active tasks. Start with a brain dump to extract your most important work.',
      mode: 'offline',
    };
  }

  const highPriority = activeTasks.filter(t => t.priority === 'high').map(t => t.title);
  const vague = activeTasks.filter(t => t.title.split(' ').length <= 3).map(t => t.title);
  const topTask = activeTasks.find(t => t.priority === 'high') || activeTasks[0];

  return {
    nextAction: topTask.title,
    highPriority,
    vague,
    recommendation: highPriority.length > 0
      ? `Focus on your ${highPriority.length} high-priority task${highPriority.length !== 1 ? 's' : ''} first. ${vague.length > 0 ? 'Some tasks may be too vague - consider breaking them down.' : 'Your list looks actionable.'}`
      : 'All tasks are medium or low priority. Pick the one with the nearest deadline or highest impact.',
    mode: 'offline',
  };
}

// ─── Next Best Action ───────────────────────────────────────────────────────

export async function getNextBestAction(
  contextPrompt: string,
  topTasks: Array<{ title: string; priority: string; score: number }>
): Promise<NextBestActionResult> {
  const fallback = buildNextBestActionFallback(topTasks);
  if (!config.geminiApiKey) return fallback;

  try {
    const prompt = `You are MindPad AI — a personal execution intelligence assistant. Based on the user's workspace context, identify the single best action to take next.

${contextPrompt}

Respond with a JSON object:
{
  "recommendedAction": "The exact task title or specific action to take next",
  "whyThisMatters": "1-2 sentences: concrete reason based on signals in the context — task age, blocking effects, repeated mentions",
  "firstStep": "The smallest concrete action to start within the next 5 minutes",
  "estimatedFocusTime": 25,
  "riskIfIgnored": "1 sentence: practical consequence of continued delay",
  "relatedTasks": ["up to 2 related task titles from the active list"],
  "confidenceLabel": "high|medium|low"
}

Rules:
- Be specific to actual tasks and context — no generic advice
- "confidenceLabel": high = multiple signals align, low = limited data
- Return ONLY valid JSON`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as NextBestActionResult;
    return {
      recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
      whyThisMatters: parsed.whyThisMatters || fallback.whyThisMatters,
      firstStep: parsed.firstStep || fallback.firstStep,
      estimatedFocusTime: typeof parsed.estimatedFocusTime === 'number' ? parsed.estimatedFocusTime : 25,
      riskIfIgnored: parsed.riskIfIgnored || fallback.riskIfIgnored,
      relatedTasks: Array.isArray(parsed.relatedTasks) ? parsed.relatedTasks : [],
      confidenceLabel: (['low', 'medium', 'high'] as const).includes(parsed.confidenceLabel) ? parsed.confidenceLabel : 'medium',
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] next-best-action failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ''}`);
    }
    return fallback;
  }
}

function buildNextBestActionFallback(
  topTasks: Array<{ title: string; priority: string; score: number }>
): NextBestActionResult {
  const top = topTasks[0];
  if (!top) {
    return {
      recommendedAction: 'Write a brain dump',
      whyThisMatters: 'Your workspace has no active tasks. Capturing your thoughts is the first step to clarity.',
      firstStep: 'Open Brain Dump and write everything on your mind.',
      estimatedFocusTime: 15,
      riskIfIgnored: 'Without capturing tasks, important work stays in your head and gets lost.',
      relatedTasks: [],
      confidenceLabel: 'high',
      mode: 'offline',
    };
  }
  return {
    recommendedAction: top.title,
    whyThisMatters: 'This task has the highest priority and urgency score based on your current list.',
    firstStep: `Open your tools for "${top.title}" and identify the first concrete action.`,
    estimatedFocusTime: 25,
    riskIfIgnored: 'Delayed high-priority tasks create bottlenecks for downstream work.',
    relatedTasks: topTasks.slice(1, 3).map(t => t.title),
    confidenceLabel: top.score >= 6 ? 'high' : top.score >= 3 ? 'medium' : 'low',
    mode: 'offline',
  };
}

// ─── Priority Brief ──────────────────────────────────────────────────────────

export async function getPriorityBrief(
  contextPrompt: string,
  topTasks: Array<{ title: string; priority: string; score: number }>
): Promise<PriorityBriefResult> {
  const fallback = buildPriorityBriefFallback(topTasks);
  if (!config.geminiApiKey) return fallback;

  try {
    const prompt = `You are MindPad AI — a personal execution intelligence assistant. Generate a concise priority brief.

${contextPrompt}

Respond with a JSON object:
{
  "topPriority": "The single most important task — exact title from the active list",
  "secondaryPriority": "Second most important — exact title, or empty string",
  "quickWin": "A task completable in under 30 minutes — exact title, or empty string",
  "avoidForNow": "A task to defer (low-signal, not blocking) — exact title, or empty string",
  "reasoning": "2-3 sentences: reference specific signals — task age, keyword matches, brain dump mentions, focus gaps",
  "suggestedFocusSession": "Specific session plan: e.g. '25 min on [task] then 5 min break, then [task]'"
}

Rules:
- Use exact task titles from the active list
- "quickWin" must be realistic and completable, not aspirational
- Return ONLY valid JSON`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as PriorityBriefResult;
    return {
      topPriority: parsed.topPriority || fallback.topPriority,
      secondaryPriority: parsed.secondaryPriority || '',
      quickWin: parsed.quickWin || '',
      avoidForNow: parsed.avoidForNow || '',
      reasoning: parsed.reasoning || fallback.reasoning,
      suggestedFocusSession: parsed.suggestedFocusSession || fallback.suggestedFocusSession,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] priority-brief failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ''}`);
    }
    return fallback;
  }
}

function buildPriorityBriefFallback(
  topTasks: Array<{ title: string; priority: string; score: number }>
): PriorityBriefResult {
  const highTasks = topTasks.filter(t => t.priority === 'high');
  const top = highTasks[0] || topTasks[0];
  const second = highTasks[1] || topTasks[1];
  const quick = topTasks.find(t => t.priority !== 'high' && t.title.split(' ').length <= 5);

  if (!top) {
    return {
      topPriority: 'Create a brain dump',
      secondaryPriority: '',
      quickWin: '',
      avoidForNow: '',
      reasoning: 'No tasks in your workspace. Start by capturing your thoughts in a brain dump.',
      suggestedFocusSession: 'Spend 15 minutes on a brain dump to surface your priorities.',
      mode: 'offline',
    };
  }

  return {
    topPriority: top.title,
    secondaryPriority: second?.title || '',
    quickWin: quick?.title || '',
    avoidForNow: '',
    reasoning: `"${top.title}" ranks highest by priority and urgency. ${highTasks.length > 1 ? `You have ${highTasks.length} high-priority items — focus on one at a time.` : 'Your active list looks manageable.'}`,
    suggestedFocusSession: `Start with a 25-minute session on "${top.title}"${second ? `, then continue with "${second.title}"` : ''}.`,
    mode: 'offline',
  };
}

// ─── Blocker Analysis ────────────────────────────────────────────────────────

export async function analyzeBlockers(contextPrompt: string): Promise<BlockerAnalysisResult> {
  const fallback: BlockerAnalysisResult = {
    blockers: [],
    overallStatus: 'No clear blockers detected. Your tasks appear actionable.',
    mode: 'offline',
  };

  if (!config.geminiApiKey) return fallback;

  try {
    const prompt = `You are MindPad AI — a personal execution intelligence assistant. Analyze the user's workspace for tasks that appear stuck, blocked, or repeatedly deferred.

${contextPrompt}

Respond with a JSON object:
{
  "blockers": [
    {
      "blocker": "Short description of what is blocking progress",
      "evidence": "Specific evidence: task age, keywords like blocked/waiting, repeated brain dump mentions",
      "impact": "What other work is affected if this stays unresolved",
      "nextAction": "Specific first step to unblock this",
      "suggestedFocusWindow": "e.g. '30 minutes tomorrow morning'"
    }
  ],
  "overallStatus": "1-2 sentences: honest read on the user's execution health"
}

Rules:
- Only include genuine blockers with real signals (stale >14d, blocker keywords, repeated mentions)
- 0-3 blockers maximum. Empty array if no clear blockers
- "evidence" must be specific, not generic
- Return ONLY valid JSON`;

    const responseText = await callAI(prompt);
    const jsonStr = extractJson(responseText);
    if (!jsonStr) return fallback;

    const parsed = JSON.parse(jsonStr) as BlockerAnalysisResult;
    return {
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
      overallStatus: parsed.overallStatus || fallback.overallStatus,
      mode: 'ai',
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MindPad AI] blocker-analysis failed: ${categorizeError(error)}${getHttpStatus(error) ? ` (HTTP ${getHttpStatus(error)})` : ''}`);
    }
    return fallback;
  }
}

