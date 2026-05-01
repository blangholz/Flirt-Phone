import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addQuestion, deleteQuestion, updateQuestion } from './actions';

export const metadata = { title: 'Question pool' };

export default async function QuestionPoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: community } = await supabase
    .from('communities')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();
  if (!community) notFound();

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, source, created_at')
    .eq('community_id', community.id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/admin/communities/${slug}`}
          className="text-sm underline hover:text-stone-900"
        >
          ← {community.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Question pool</h1>
        <p className="mt-2 text-sm text-stone-600">
          Members get a random question from this pool. Edit anything that doesn&rsquo;t
          fit; remove duds; add your own. Aim for 15–25.
        </p>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="rounded border border-dashed border-stone-400 px-6 py-12 text-center text-sm text-stone-600">
          No questions yet.{' '}
          <Link
            href={`/admin/communities/${slug}/setup`}
            className="underline hover:text-stone-900"
          >
            Run the setup interview
          </Link>{' '}
          to generate a starting pool.
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="border border-stone-300 p-3">
              <form action={updateQuestion} className="space-y-2">
                <input type="hidden" name="communitySlug" value={slug} />
                <input type="hidden" name="questionId" value={q.id} />
                <textarea
                  name="text"
                  defaultValue={q.question_text}
                  rows={2}
                  className="block w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    {q.source === 'admin_added' ? 'admin-added' : 'generated'}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="underline text-stone-700 hover:text-stone-900"
                    >
                      Save
                    </button>
                    <button
                      type="submit"
                      formAction={deleteQuestion}
                      className="underline text-red-700 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2 className="text-sm font-semibold">Add a question</h2>
        <form action={addQuestion} className="mt-2 space-y-2">
          <input type="hidden" name="communitySlug" value={slug} />
          <textarea
            name="text"
            rows={2}
            placeholder="What's the most generous thing someone here has done for you?"
            className="block w-full border border-stone-400 bg-white px-3 py-2 focus:border-stone-600 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-stone-900 px-4 py-2 text-sm text-amber-50 hover:bg-stone-700"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
