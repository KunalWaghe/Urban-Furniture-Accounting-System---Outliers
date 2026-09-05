import Link from "next/link";

export function PublicInfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-primary-600 hover:underline">Urban Furniture Accounting</Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-text-muted">{intro}</p>
        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-7 text-text-muted">{section.body}</p>
            </section>
          ))}
        </div>
        <Link href="/login" className="mt-8 inline-flex rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Back to sign in</Link>
      </div>
    </main>
  );
}
