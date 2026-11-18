import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-brand">DREAM CYBER SECURITY</p>
          <h1 className="text-2xl font-bold">CRM Portal</h1>
        </div>
        <LoginForm next={next || "/dashboard"} />
      </div>
    </main>
  );
}
