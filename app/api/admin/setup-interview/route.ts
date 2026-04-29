// Admin setup interview — captures community context for question-pool generation.
//
// Milestone 2: receives admin's answers to the 5-min (event) or 15-min (ongoing)
// interview, persists them with the community row, then triggers question generation.
//
// Auth: Supabase magic-link session (admin must own the community).
// Spec refs: PDK §11.2, Architect §1 (Anthropic question-pool generation).

export async function POST(_request: Request) {
  return new Response('Not implemented yet — Milestone 2', { status: 501 });
}
