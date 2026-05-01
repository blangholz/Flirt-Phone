import { z } from 'zod';
import { getAnthropicClient } from '@/lib/anthropic';

// Setup-interview answers from the admin. Free-form text; quality of the
// generated question pool depends directly on these.
export const interviewAnswersSchema = z.object({
  what: z.string().min(10).max(2000), // What's the community / space?
  who: z.string().min(10).max(2000), // Who's the typical member?
  vibe: z.string().min(10).max(2000), // Atmosphere / culture
  topics: z.string().max(2000).optional(), // Topics to lean into or avoid
});

export type InterviewAnswers = z.infer<typeof interviewAnswersSchema>;

// Number of candidate questions per generation pass. Admin will trim/edit.
const TARGET_QUESTION_COUNT = 20;

const SYSTEM_PROMPT = `You are designing voice-intro questions for FlirtPhone, a voice-first community dating system. Members of a defined community (a yoga studio, a wedding, a party) record a 30-second voice answer to one question — that recording becomes their public profile. Different members get different questions from the pool you generate.

What makes a good question:
- Specific to the community's context, not generic dating-app filler.
- Reveals personality, taste, or worldview — not credentials or stats.
- Inviting and warm, not interrogative or clinical.
- Answerable in under 30 seconds by a non-rehearsed speaker.
- Open-ended (no yes/no) but not abstract ("what is love?").
- Avoids loaded prompts about appearance, sex, money, politics, religion.

What to avoid:
- "Tell us about yourself" or "what do you do?"
- Anything that could be answered with a noun or single phrase.
- Anything cringey, salesy, or therapy-coded.
- Anything assuming the speaker is heterosexual, neurotypical, single, or coupled.

Return ONLY valid JSON, no prose, in this exact shape:
{"questions": ["…", "…", …]}`;

export interface GeneratedQuestion {
  text: string;
}

export async function generateQuestions(
  community: { name: string; type: 'ongoing' | 'temporary' },
  answers: InterviewAnswers,
): Promise<GeneratedQuestion[]> {
  const userPrompt = [
    `Community: ${community.name}`,
    `Type: ${community.type === 'ongoing' ? 'ongoing space' : 'one-time event'}`,
    '',
    `What is this community / space?`,
    answers.what,
    '',
    `Who's a typical member?`,
    answers.who,
    '',
    `What's the atmosphere / culture?`,
    answers.vibe,
    answers.topics
      ? `\nTopics to lean into or avoid:\n${answers.topics}`
      : '',
    '',
    `Generate ${TARGET_QUESTION_COUNT} candidate questions tailored to this community.`,
  ]
    .filter(Boolean)
    .join('\n');

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = parseQuestionsJson(text);
  return parsed.map((q) => ({ text: q }));
}

// Tolerant parser — accepts either {"questions": [...]} or a bare JSON array,
// trims fences/prose if Claude leaks them.
function parseQuestionsJson(text: string): string[] {
  const trimmed = text.trim().replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch {
    throw new Error('Question generation returned invalid JSON.');
  }
  const list = Array.isArray(value)
    ? value
    : (value as { questions?: unknown }).questions;
  if (!Array.isArray(list)) {
    throw new Error('Question generation JSON did not contain a "questions" array.');
  }
  const questions = list
    .map((q) => (typeof q === 'string' ? q.trim() : ''))
    .filter((q): q is string => q.length > 0);
  if (questions.length === 0) {
    throw new Error('Question generation produced zero usable questions.');
  }
  return questions;
}
