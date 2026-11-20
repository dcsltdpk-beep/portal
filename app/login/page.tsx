import Image from "next/image";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="relative grid min-h-screen place-items-center bg-navy-950 p-4 overflow-hidden">
      {/* Background radial glow patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(251,174,68,0.15)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(62,56,135,0.25)_0%,transparent_50%),radial-gradient(circle_at_15%_75%,rgba(40,36,95,0.35)_0%,transparent_45%)]" />

      <div className="card relative z-10 w-full max-w-sm p-8 shadow-2xl border-navy-border/40 bg-white">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Dream Cyber Security Logo"
            width={64}
            height={64}
            className="mb-3 h-16 w-16 object-contain drop-shadow"
            priority
          />
          <p className="text-[11px] font-bold tracking-widest text-navy uppercase">DREAM CYBER SECURITY</p>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">CRM Portal</h1>
          <p className="mt-1 text-xs text-slate-500">Sign in with your team credentials</p>
        </div>
        <LoginForm next={next || "/dashboard"} />
      </div>
    </main>
  );
}
