import Anthropic from '@anthropic-ai/sdk';
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

function getRealisticFallback(
  brainDump: string
): OrganizeResult {
  // Generate realistic fallback output based on the brain dump content
  const lines = brainDump.split('\n').filter((l) => l.trim());
  const wordCount = brainDump.split(/\s+/).length;

  // Extract potential tasks from common patterns
  const potentialTasks: string[] = [];
  lines.forEach((line) => {
    if (
      line.match(/^[-•*]/i) ||
      line.match(/\b(need|need to|should|must|have to)\b/i)
    ) {
      potentialTasks.push(line.replace(/^[-•*]\s*/, '').substring(0, 60));
    }
  });

  return {
    summary:
      potentialTasks.length > 0
        ? `You've outlined ${potentialTasks.length} key areas that need attention. ${wordCount > 50 ? 'Your thoughts are detailed and focused.' : 'Consider expanding on these points for clarity.'}`
        : 'Your notes contain several interconnected thoughts. Focus on the most urgent items first.',
    tasks:
      potentialTasks.length > 0
        ? potentialTasks.slice(0, 5)
        : [
            'Review and prioritize main objectives',
            'Break down complex tasks into steps',
            'Schedule focused work blocks',
          ],
    priorities:
      potentialTasks.length > 0
        ? ['High', 'Medium', 'Medium', 'Low', 'Low'].slice(0, Math.min(5, potentialTasks.length))
        : ['High', 'Medium', 'Low'],
    focusRecommendation:
      potentialTasks.length > 0
        ? potentialTasks[0]
        : 'Start with the most time-sensitive or impactful task.',
    reasoning:
      'Based on your brain dump, these are the most actionable items. This fallback is generated without AI—organize with API key for enhanced suggestions.',
  };
}

export async function organizeWithAI(
  brainDump: string
): Promise<OrganizeResult> {
  // If no API key, return realistic fallback
  if (!config.anthropicApiKey) {
    return getRealisticFallback(brainDump);
  }

  try {
    const client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a productivity coach helping organize scattered thoughts into actionable tasks.

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

Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getRealisticFallback(brainDump);
    }

    const parsed = JSON.parse(jsonMatch[0]) as OrganizeResult;

    // Validate structure
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

export async function generateMorningBrief(
  userContext: string
): Promise<MorningBriefResult> {
  if (!config.anthropicApiKey) {
    return {
      briefText:
        'Welcome back! Focus on your highest-priority task first, then tackle secondary items. Break your day into focused blocks with short breaks in between.',
      topPriority: userContext || 'Review your main objectives for today',
      suggestedFocusTime: 90,
      keyThemesText:
        'Productivity, focused work, achieving key goals. Consider your energy levels and schedule breaks accordingly.',
    };
  }

  try {
    const client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Create a brief morning productivity brief based on this context:
${userContext || 'General productivity advice'}

Return JSON with:
- briefText: Motivating morning message (1-2 sentences)
- topPriority: Main focus for today
- suggestedFocusTime: Minutes for first focus block (60-120)
- keyThemesText: Key themes to keep in mind

Return ONLY valid JSON.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        briefText:
          'Good morning! Focus on your highest-priority task first.',
        topPriority: 'Main objective',
        suggestedFocusTime: 90,
        keyThemesText: 'Productive focus, steady progress.',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as MorningBriefResult;
    return {
      briefText: parsed.briefText || 'Good morning!',
      topPriority: parsed.topPriority || 'Main objective',
      suggestedFocusTime: parsed.suggestedFocusTime || 90,
      keyThemesText: parsed.keyThemesText || 'Productivity and focus.',
    };
  } catch (error) {
    console.error('Morning brief generation error:', error);
    return {
      briefText: 'Good morning! Time to focus on what matters.',
      topPriority: 'Your main objective',
      suggestedFocusTime: 90,
      keyThemesText: 'Focused work and progress.',
    };
  }
}

export async function generateEveningSummary(
  accomplishments: string[]
): Promise<EveningSummaryResult> {
  if (!config.anthropicApiKey) {
    return {
      summary:
        accomplishments.length > 0
          ? `You completed ${accomplishments.length} tasks today. Great progress!`
          : 'Today was a productive day. Every step forward counts.',
      accomplishments:
        accomplishments.length > 0
          ? accomplishments
          : ['Made progress on key objectives'],
      lessonsLearned: [
        'Focus works best in dedicated blocks',
        'Prioritization saves time and energy',
      ],
      tomorrowPreview:
        'Start fresh tomorrow with the top 3 priorities. Rest well tonight.',
    };
  }

  try {
    const client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    const accomplishmentList =
      accomplishments.length > 0
        ? accomplishments.join('\n- ')
        : 'Made progress throughout the day';

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Create an evening summary based on these accomplishments:
- ${accomplishmentList}

Return JSON with:
- summary: Overall reflection (1-2 sentences)
- accomplishments: Array of key wins
- lessonsLearned: Array of insights (2-3)
- tomorrowPreview: One-line tomorrow preview

Return ONLY valid JSON.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        summary: 'Great work today!',
        accomplishments: accomplishments || ['Productive day'],
        lessonsLearned: ['Progress requires focused effort', 'Rest is essential'],
        tomorrowPreview: 'Start tomorrow with clear priorities.',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as EveningSummaryResult;
    return {
      summary: parsed.summary || 'Great work today!',
      accomplishments: Array.isArray(parsed.accomplishments)
        ? parsed.accomplishments
        : accomplishments || ['Productive work completed'],
      lessonsLearned: Array.isArray(parsed.lessonsLearned)
        ? parsed.lessonsLearned
        : ['Focus is powerful', 'Rest enables performance'],
      tomorrowPreview:
        parsed.tomorrowPreview || 'Start fresh tomorrow with clear priorities.',
    };
  } catch (error) {
    console.error('Evening summary generation error:', error);
    return {
      summary: 'Excellent work today!',
      accomplishments: accomplishments || ['Productive day'],
      lessonsLearned: ['Consistency drives progress', 'Balance work and rest'],
      tomorrowPreview: 'Tomorrow: Focus on top 3 priorities.',
    };
  }
}
