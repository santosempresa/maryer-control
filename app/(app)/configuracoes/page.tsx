"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/ToastProvider";
import { changePassword, getCurrentUser, logout, updateAvatar, type CurrentUser } from "@/lib/auth";
import { resizeImageToDataUrl } from "@/lib/image-resize";

export default function ConfiguracoesPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }

    setSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("success", "Senha atualizada.");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const result = await updateAvatar(dataUrl);
      if (!result.ok) {
        showToast("error", result.error);
        return;
      }
      showToast("success", "Foto de perfil atualizada.");
      window.location.reload();
    } catch {
      showToast("error", "Não foi possível processar essa imagem.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    const result = await updateAvatar(null);
    setAvatarBusy(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    showToast("success", "Foto de perfil removida.");
    window.location.reload();
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (user === undefined) return <PageSpinner />;

  return (
    <>
      <PageHeader title="Configurações" description="Conta, foto de perfil e senha" />
      <PageContent className="max-w-md space-y-6">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <Avatar avatarData={user?.avatarData} size={64} />
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={avatarBusy}
              >
                <Camera size={16} />
                {user?.avatarData ? "Trocar foto" : "Adicionar foto"}
              </Button>
              {user?.avatarData && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarBusy}
                  className="flex items-center gap-1.5 text-xs font-medium text-danger hover:underline disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-medium text-foreground">Conta</h2>
          <p className="mb-4 text-sm text-muted">{user?.username ?? "-"}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Senha atual">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Field label="Nova senha" hint="Mínimo de 6 caracteres.">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar nova senha" error={error ?? undefined}>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" loading={submitting}>
              Salvar nova senha
            </Button>
          </form>
        </div>

        <Button variant="secondary" className="w-full md:hidden" onClick={handleLogout}>
          Sair da conta
        </Button>
      </PageContent>
    </>
  );
}
