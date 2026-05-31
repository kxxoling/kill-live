"use client";

import BoringAvatar from "boring-avatars";

interface AvatarProps {
  name: string;
  size?: number;
  variant?: "beam" | "marble" | "pixel" | "ring" | "sunset";
  className?: string;
}

export function Avatar({
  name,
  size = 40,
  variant = "beam",
  className = "",
}: AvatarProps) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  return (
    <BoringAvatar
      name={name}
      size={size}
      variant={variant}
      colors={colors}
      className={className}
    />
  );
}
