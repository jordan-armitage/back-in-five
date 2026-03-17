export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}){1,2}$/i.test(value);
}

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed : fallback;
}

export function getReadableTextColor(hex: string): string {
  const safe = isValidHexColor(hex) ? hex : "#0f766e";
  const normalized = safe.length === 4
    ? "#" + safe[1] + safe[1] + safe[2] + safe[2] + safe[3] + safe[3]
    : safe;

  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}
