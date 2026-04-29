export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <h1 className="text-5xl font-bold tracking-tight">FlirtPhone</h1>
        <p className="mt-4 text-lg text-stone-600">
          Voice-first community dating. Pick up the phone.
        </p>

        <hr className="my-12 border-stone-300" />

        <section className="space-y-3 text-sm text-stone-500">
          <p>Under construction.</p>
          <p>
            Setting up a community?{' '}
            <a className="underline hover:text-stone-900" href="/admin">
              Go to /admin
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
