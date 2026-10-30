const REGION_NAMES: Record<string, string> = {
  local: "Local",
  id: "Indonesia",
  sg: "Singapore",
  jp: "Japan",
  hk: "Hong Kong",
  tw: "Taiwan",
  kr: "Korea",
  vn: "Vietnam",
  th: "Thailand",
  de: "Germany",
  nl: "Netherlands",
  uk: "United Kingdom",
  us: "USA",
  "us-east": "US East",
  "us-west": "US West",
};

export function regionName(code: string): string {
  return REGION_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}
