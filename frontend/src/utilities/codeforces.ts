// Matches Codeforces official rank colours
export function getRankColor(rank: string | null): string {
  if (!rank) return "#64748B";
  const r = rank.toLowerCase();
  if (r.includes("legendary grandmaster")) return "#FF0000";
  if (r.includes("international grandmaster")) return "#FF0000";
  if (r.includes("grandmaster")) return "#FF0000";
  if (r.includes("international master")) return "#FF8C00";
  if (r.includes("master")) return "#FF8C00";
  if (r.includes("candidate master")) return "#AA00AA";
  if (r.includes("expert")) return "#6B90E8";
  if (r.includes("specialist")) return "#03A89E";
  if (r.includes("pupil")) return "#008000";
  return "#808080"; // newbie
}