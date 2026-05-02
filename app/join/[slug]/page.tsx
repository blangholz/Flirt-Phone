import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Join ${slug} · FlirtPhone` };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: community } = await supabase
    .from('communities')
    .select('name, slug, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!community) notFound();

  const phoneNumber = getServerEnv().TWILIO_PHONE_NUMBER ?? '';
  const smsBody = `FLIRT ${slug}`;
  const smsHref = phoneNumber
    ? `sms:${phoneNumber}?body=${encodeURIComponent(smsBody)}`
    : null;
  const displayNumber = formatPhoneForDisplay(phoneNumber);

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-12">
        <p className="text-sm text-stone-500">
          <Link className="underline hover:text-stone-900" href="/">
            FlirtPhone
          </Link>
        </p>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          Join the {community.name} FlirtPhone
        </h1>
        <p className="mt-3 text-stone-700 leading-relaxed">
          Voice-first community dating. Tap below to start signup —
          we&rsquo;ll text you a few quick questions, then call you to
          record a 30-second voice intro.
        </p>

        {smsHref ? (
          <a
            href={smsHref}
            className="mt-8 block w-full text-center bg-stone-900 text-amber-50 font-bold py-5 px-6 rounded text-lg active:bg-stone-700 hover:bg-stone-800 transition-colors"
          >
            Tap to text FLIRT →
          </a>
        ) : (
          <div className="mt-8 rounded border border-dashed border-stone-400 px-4 py-6 text-center text-sm text-stone-600">
            FlirtPhone isn&rsquo;t fully configured yet. Check back soon.
          </div>
        )}

        {phoneNumber ? (
          <p className="mt-4 text-center text-sm text-stone-500">
            On a desktop? Text <strong>FLIRT {slug}</strong> to{' '}
            <span className="whitespace-nowrap">{displayNumber}</span> from
            your phone.
          </p>
        ) : null}

        <hr className="my-10 border-stone-300" />

        <section className="space-y-3">
          <h2 className="font-bold">What happens after you text:</h2>
          <ol className="list-decimal pl-6 space-y-2 text-sm text-stone-700">
            <li>We ask for your name and a few profile details.</li>
            <li>You send us a photo (this appears on the public Rolodex).</li>
            <li>We call you back to record a 30-second voice intro.</li>
            <li>You&rsquo;re on the Rolodex — start dialing other members.</li>
          </ol>
        </section>

        <hr className="my-10 border-stone-300" />

        <section className="space-y-2 text-xs text-stone-500 leading-relaxed">
          <p>
            By texting FLIRT you opt in to receive recurring SMS from
            FlirtPhone for signup, message alerts, and match notifications.
            Message frequency varies. Msg&amp;data rates may apply.
          </p>
          <p>
            Reply <strong>HELP</strong> for help. Reply{' '}
            <strong>STOP</strong> to cancel.
          </p>
          <p>
            <Link className="underline hover:text-stone-900" href="/privacy">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link className="underline hover:text-stone-900" href="/terms">
              Terms
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function formatPhoneForDisplay(e164: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
}
