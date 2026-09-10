export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">You do not have permission to view this page.</p>
      </section>
    </main>
  );
}