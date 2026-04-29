// Inbound Twilio Voice webhook (TwiML response).
//
// Milestone 4 (outbound voice intro recording): respond with TwiML to play
// the question prompt, then <Record> for 30s.
// Milestone 7 (production phone): route inbound calls through phone state machine.
//
// Spec refs: PDK §5.2 (intro recording), §7 (phone interface), Architect §5.3, §5.4.

export async function POST(_request: Request) {
  // Stub: respond with TwiML that hangs up.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>FlirtPhone is not yet available. Please try again later.</Say>
  <Hangup/>
</Response>`;
  return new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
