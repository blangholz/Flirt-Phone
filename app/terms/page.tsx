import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SMS Terms & Conditions — FlirtPhone',
  description: 'Terms and conditions for FlirtPhone SMS messaging.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-stone-500">
          <a className="underline hover:text-stone-900" href="/">
            ← FlirtPhone
          </a>
        </p>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          SMS Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-stone-500">Effective: May 1, 2026</p>

        <hr className="my-8 border-stone-300" />

        <section className="space-y-6 text-stone-800 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold">Program</h2>
            <p className="mt-2">
              FlirtPhone is a voice-first community dating service operated by
              Ben Langholz (&ldquo;FlirtPhone,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us&rdquo;). When you opt in to FlirtPhone SMS, you are
              enrolling in a recurring messaging program for the community you
              joined (e.g., a yoga studio, wedding, house venue, or event).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Program description</h2>
            <p className="mt-2">
              By opting in, you agree to receive SMS and MMS messages from
              FlirtPhone, including: (a) conversational signup prompts that
              collect your name, photo, age, and a short profile so you can
              appear on your community&rsquo;s public Rolodex; (b) notifications
              when another member leaves you a voice message; (c) match
              notifications that share contact information with another member
              when both of you have indicated interest; and (d) periodic
              prompts to refresh your voice profile.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Message frequency</h2>
            <p className="mt-2">
              Message frequency varies based on your activity in the community.
              You should expect roughly 1 to 5 messages per week while your
              community is active.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Cost</h2>
            <p className="mt-2">
              <strong>Message and data rates may apply.</strong> FlirtPhone
              does not charge you for any messages we send or receive. Your
              wireless carrier may charge you according to your messaging plan.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">How to opt in</h2>
            <p className="mt-2">
              You opt in by sending an SMS keyword (such as <em>JOIN</em>,{' '}
              <em>START</em>, or <em>FLIRT</em>) to the FlirtPhone phone number
              listed on your community&rsquo;s signage or shared by your
              community administrator. After your first inbound message, we
              will reply with a confirmation that includes these terms in
              short form.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">How to get help</h2>
            <p className="mt-2">
              For help, reply <strong>HELP</strong> to any FlirtPhone message,
              or email{' '}
              <a
                className="underline hover:text-stone-900"
                href="mailto:blangholz@gmail.com"
              >
                blangholz@gmail.com
              </a>
              . We will reply with a brief description of the program and a
              support contact.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">How to opt out</h2>
            <p className="mt-2">
              You can cancel the FlirtPhone SMS program at any time. Reply{' '}
              <strong>STOP</strong> to any FlirtPhone message. After you send
              STOP, we will send you a one-time confirmation that you have
              been unsubscribed and you will receive no further messages from
              FlirtPhone unless you opt in again.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Carriers and delivery</h2>
            <p className="mt-2">
              Carriers are not liable for delayed or undelivered messages. We
              support all major US carriers, including AT&amp;T, T-Mobile,
              Verizon Wireless, Sprint, Boost, U.S. Cellular, MetroPCS, Virgin
              Mobile, Cricket, Alltel, Cellular One, and others. T-Mobile is
              not liable for delayed or undelivered messages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Eligibility</h2>
            <p className="mt-2">
              FlirtPhone SMS is available to users with phone numbers on US
              carriers only. You must be at least 18 years old to participate.
              By opting in, you confirm that the phone number you used to opt
              in is yours or that you are authorized to opt in that number.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Privacy</h2>
            <p className="mt-2">
              Your phone number and the contents of your messages are handled
              under our{' '}
              <a className="underline hover:text-stone-900" href="/privacy">
                Privacy Policy
              </a>
              . We do not sell, rent, or share your phone number with third
              parties for marketing purposes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Changes</h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes
              will be communicated via SMS or by updating the effective date
              above. Continued use of FlirtPhone after a change constitutes
              acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Contact</h2>
            <p className="mt-2">
              Questions about this program? Email{' '}
              <a
                className="underline hover:text-stone-900"
                href="mailto:blangholz@gmail.com"
              >
                blangholz@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
