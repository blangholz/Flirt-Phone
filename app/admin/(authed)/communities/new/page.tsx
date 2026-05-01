import { NewCommunityForm } from './new-community-form';

export const metadata = { title: 'New community' };

export default function NewCommunityPage() {
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New community</h1>
        <p className="mt-2 text-sm text-stone-600">
          You&rsquo;ll run a setup interview right after this.
        </p>
      </div>
      <NewCommunityForm />
    </div>
  );
}
