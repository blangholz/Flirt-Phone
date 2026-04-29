// Generate the question pool via Anthropic API.
//
// Milestone 2: takes the community's setup-interview answers, prompts Claude
// to produce ~20 candidate questions, returns them for admin review/approval.
//
// Auth: admin Supabase session.
// Spec refs: PDK §11.2, Architect §5.5.

export async function POST(_request: Request) {
  return new Response('Not implemented yet — Milestone 2', { status: 501 });
}
