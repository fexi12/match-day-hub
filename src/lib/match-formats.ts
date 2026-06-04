export type Format = "5v5" | "5x5x5" | "7v7" | "8v8" | "11v11";

export const FIVE_MODE_FORMAT: Format = "5x5x5";

export const MATCH_FORMATS: Array<{ value: Format; label: string; description: string }> = [
  { value: "5v5", label: "5 v 5", description: "Classic 5-a-side match" },
  {
    value: FIVE_MODE_FORMAT,
    label: "5x5x5",
    description: "Three-team 5-a-side mini-match session",
  },
  { value: "7v7", label: "7 v 7", description: "Seven-a-side match" },
  { value: "8v8", label: "8 v 8", description: "Eight-a-side match" },
  { value: "11v11", label: "11 v 11", description: "Full match" },
];

export const isFiveModeFormat = (format: Format) => format === FIVE_MODE_FORMAT;

export const lineupSizeForFormat = (format: Format) => {
  if (isFiveModeFormat(format)) return 15;
  return Number.parseInt(format, 10);
};
