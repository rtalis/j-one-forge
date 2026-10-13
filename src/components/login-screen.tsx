import { useState } from "react";
import { Landmark, LogIn, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import loginBg from "@/assets/login-bg.jpeg";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginClient } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { signIn, isFromPortal, voltarAoPortal } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginClient({ username, password });
      signIn(res.token, username);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível entrar";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-dvh w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {isFromPortal && (
        <button
          type="button"
          onClick={voltarAoPortal}
          className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Portal</span>
        </button>
      )}

      {/* Dark green overlay over the photo */}
      <div className="absolute inset-0 bg-[oklch(0.28_0.055_150/0.72)]" />

      <div className="relative z-10 flex min-h-dvh items-center justify-between gap-10 px-6 py-10 md:px-16 lg:px-24">
        {/* Branding */}
        <div className="hidden max-w-xl text-white md:block">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight">{APP_CONFIG.loginTitle}</h1>
          <div className="mt-2">
            <p className="text-2xl font-light text-emerald-300">{APP_CONFIG.loginTagline}</p>
            <div className="mt-3 h-[3px] w-24 rounded-full bg-emerald-300/80" />
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85">
            {APP_CONFIG.loginDescription}
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8"
          >
            <div className="mb-6 md:hidden">
              <h1 className="text-3xl font-bold text-white">{APP_CONFIG.loginTitle}</h1>
              <p className="text-sm text-emerald-300">{APP_CONFIG.loginTagline}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="seu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="h-11 rounded-lg border-white/40 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-lg border-white/40 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-4 flex items-start gap-3 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-3 text-sm text-red-50 shadow-sm"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/30">
                  <AlertCircle className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">Não foi possível entrar</p>
                  <p className="mt-0.5 text-xs text-red-100/90">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-6 h-11 w-full rounded-lg bg-[oklch(0.22_0.05_150)] text-white hover:bg-[oklch(0.28_0.05_150)]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
