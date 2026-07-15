export interface CurrentUser {
  id: string;
  username: string;
  avatarData: string | null;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export async function login(
  username: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    return { ok: false, error: await parseErrorMessage(res, "Usuário ou senha incorretos.") };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.user ?? null;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    return { ok: false, error: await parseErrorMessage(res, "Não foi possível atualizar a senha.") };
  }
  return { ok: true };
}

export async function updateAvatar(
  avatarData: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarData }),
  });
  if (!res.ok) {
    return { ok: false, error: await parseErrorMessage(res, "Não foi possível salvar a foto.") };
  }
  return { ok: true };
}
