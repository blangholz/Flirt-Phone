import Link from 'next/link';

export default function PhoneNotFound() {
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight">No phone here</h1>
        <p className="mt-4 text-stone-600">
          That community doesn&rsquo;t exist, has been closed, or is dormant.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          <Link href="/" className="underline hover:text-stone-900">
            ← Back to FlirtPhone
          </Link>
        </p>
      </div>
    </main>
  );
}
