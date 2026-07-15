"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(username.trim(), password);
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    showToast("success", "Login realizado.");
    router.push("/hoje");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-alt px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-medium text-foreground">Atendimentos Maryer</h1>
          <p className="mt-1 text-sm text-muted">Gestão de atendimentos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Usuário">
            <Input
              type="text"
              name="fisio-user"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </Field>
          <Field label="Senha" error={error ?? undefined}>
            <Input
              type="password"
              name="fisio-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
