import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FlirtPhone',
  description: 'How FlirtPhone collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-stone-500">
          <Link className="underline hover:text-stone-900" href="/">
            ← FlirtPhone
          </Link>
        </p>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-stone-500">Effective: May 1, 2026</p>

        <hr className="my-8 border-stone-300" />

        <section className="space-y-6 text-stone-800 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold">Summary</h2>
            <p className="mt-2">
              FlirtPhone is a voice-first community dating service. This
              policy explains what data we collect, how we use it, and the
              choices you have. The short version: <strong>we do not sell,
              rent, or share your personal information &mdash; including your
              phone number and SMS data &mdash; with third parties or
              affiliates for their marketing purposes.</strong> We also do not
              share SMS opt-in data, phone numbers, or message content for any
              purpose unrelated to operating FlirtPhone.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">What we collect</h2>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                <strong>Profile information you provide during signup:</strong>{' '}
                first name, age, gender, orientation, approximate location, a
                short interests blurb, and a photo. This information is shown
                publicly on your community&rsquo;s Rolodex.
              </li>
              <li>
                <strong>Phone number.</strong> We collect the phone number you
                use to opt in. Your phone number is <strong>private</strong>{' '}
                and is not shown on the Rolodex or to other members unless and
                until you and another member mutually match.
              </li>
              <li>
                <strong>Voice intro recording.</strong> A 30-second voice
                recording you make in response to a community-specific
                question. This plays publicly on the Rolodex.
              </li>
              <li>
                <strong>Voice messages.</strong> Voice messages you send to or
                receive from other community members. These are stored so
                recipients can listen to them via the FlirtPhone phone
                interface. Messages are never published on the Rolodex.
              </li>
              <li>
                <strong>SMS conversation data.</strong> The SMS messages you
                exchange with FlirtPhone during signup and the system-generated
                notifications we send you (new-message alerts, match
                notifications, profile-refresh prompts).
              </li>
              <li>
                <strong>Basic usage data.</strong> Logs of FlirtPhone phone
                interactions (which member you dialed, when), used to deliver
                messages and prevent abuse.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">How we use your information</h2>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                To operate FlirtPhone: show your profile to your community,
                route voice messages between members, send SMS notifications,
                and handle mutual matches.
              </li>
              <li>
                To prevent abuse and enforce our terms (e.g., rate limiting,
                blocking spam).
              </li>
              <li>To respond to your support requests.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">What we do not do</h2>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                We do not sell, rent, or trade your personal information to
                anyone.
              </li>
              <li>
                We do not share your phone number, SMS opt-in data, or message
                content with third parties or affiliates for their marketing
                purposes.
              </li>
              <li>
                We do not use your data to send marketing or promotional
                messages on behalf of unrelated businesses.
              </li>
              <li>
                Community administrators have access only to{' '}
                <strong>metadata</strong> about your participation (whether
                you registered, when you last refreshed your intro). They do
                not have access to your voice messages or message contents.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">Service providers we use</h2>
            <p className="mt-2">
              We use a small set of service providers to operate FlirtPhone.
              These providers process data on our behalf under contracts that
              prohibit them from using it for their own purposes:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                <strong>Twilio</strong> &mdash; SMS, MMS, and voice
                infrastructure. Twilio processes the phone numbers and
                messages required to deliver SMS and route phone calls.
              </li>
              <li>
                <strong>Supabase</strong> &mdash; database, authentication,
                and audio storage.
              </li>
              <li>
                <strong>Vercel</strong> &mdash; web hosting and serverless
                functions.
              </li>
              <li>
                <strong>Anthropic</strong> &mdash; LLM used by community
                administrators to generate the question pool for their
                community. Member profile information is not sent to
                Anthropic.
              </li>
            </ul>
            <p className="mt-2">
              We do not allow these providers to use your information for
              their own advertising or marketing.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Public profile information</h2>
            <p className="mt-2">
              Your name, photo, age, gender, orientation, location, interests,
              and voice intro are <strong>public on the Rolodex of the
              community you joined</strong>. This is the core function of the
              service. Do not include information in your profile that you
              are not comfortable sharing publicly within your community. Your
              phone number is never shown on the Rolodex.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Mutual matches</h2>
            <p className="mt-2">
              When you and another community member mutually match, we share
              each member&rsquo;s name and phone number with the other via
              SMS. This is the explicit purpose of a match. Outside of a
              mutual match, your phone number is not shared with other
              members.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Retention</h2>
            <p className="mt-2">
              For temporary communities (a wedding, an event), all interfaces
              close at the community end date and your data becomes dormant.
              Voice messages and profile data are retained in dormant form so
              the system remains internally consistent, but are not
              accessible through any interface. SMS records of mutual-match
              contact info already delivered to your phone remain in your SMS
              app under your control. You can request deletion of your
              FlirtPhone profile and associated voice content at any time by
              emailing the address below.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Your choices</h2>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                <strong>Opt out of SMS.</strong> Reply <strong>STOP</strong>{' '}
                to any FlirtPhone message at any time to stop receiving SMS.
                See our{' '}
                <Link className="underline hover:text-stone-900" href="/terms">
                  SMS Terms &amp; Conditions
                </Link>
                .
              </li>
              <li>
                <strong>Delete your profile.</strong> Email us to request
                deletion. We will remove your profile from the Rolodex and
                delete your voice intro and voice messages.
              </li>
              <li>
                <strong>Access or correct your data.</strong> Email us to
                request a copy of the data we hold about you, or to correct
                inaccurate data.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">Children</h2>
            <p className="mt-2">
              FlirtPhone is not intended for anyone under the age of 18. We
              do not knowingly collect data from children.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Security</h2>
            <p className="mt-2">
              We use industry-standard security practices to protect your
              data, including encrypted connections (HTTPS), database
              row-level security, and access controls. No system is perfectly
              secure; if we discover a breach affecting your data we will
              notify you as required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Changes</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes
              will be communicated via SMS or by updating the effective date
              above.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">Contact</h2>
            <p className="mt-2">
              Questions about this policy or your data? Email{' '}
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
