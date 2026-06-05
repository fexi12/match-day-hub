export type MatchReportMode = "standard" | "five-mode";

export const reportModeForFormat = (format: string): MatchReportMode =>
  format === "5x5x5" ? "five-mode" : "standard";
