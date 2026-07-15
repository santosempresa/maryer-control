interface AvatarProps {
  avatarData?: string | null;
  size?: number;
}

export function Avatar({ avatarData, size = 36 }: AvatarProps) {
  if (avatarData) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image can't optimize it anyway
      <img
        src={avatarData}
        alt="Foto de perfil"
        className="shrink-0 rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white"
      style={{ width: size, height: size }}
    >
      M
    </div>
  );
}
