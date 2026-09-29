/** Formatea "HH:MM:SS" (o "HH:MM") de Postgres a "7:00am" / "2:15pm". */
export function formatTime12(value: string) {
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr}${period}`;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime12(start)} a ${formatTime12(end)}`;
}
