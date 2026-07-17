import { Speaker, SpeakerCategory, SpeakerStatus } from "@/lib/types";

const categories: SpeakerCategory[] = ["Member State", "Non-State Actor", "Observer", "UN Entity", "Intergovernmental Organization", "Government Entity", "Secretariat"];
const statuses: SpeakerStatus[] = ["available", "queued", "speaking", "completed", "unavailable"];
const headerNames = new Set(["fullname", "delegation", "title", "category", "preferredlanguage", "status", "entity", "type", "speaker", "name"]);

export function parseSpeakerCsv(csv: string): Speaker[] {
  const rows = normalizePastedRows(csv).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasHeader = rows[0]?.split(",").some((cell) => headerNames.has(normalize(cell)));
  const data = hasHeader ? rows.slice(1) : rows;
  return data.map((line, index) => {
    const cells = parseCsvLine(line);
    if (isCompactEntityRow(cells)) return compactSpeaker(cells, index);

    const [fullName, delegation, title, category, preferredLanguage, status] = cells;
    return {
      id: `imported-${Date.now()}-${index}`,
      fullName: fullName || "Unnamed speaker",
      delegation: delegation || "Unspecified delegation",
      title,
      category: categories.includes(category as SpeakerCategory) ? (category as SpeakerCategory) : "Member State",
      preferredLanguage,
      status: statuses.includes(status as SpeakerStatus) ? (status as SpeakerStatus) : "available"
    };
  });
}

function normalizePastedRows(csv: string) {
  return csv
    .replace(/\s+(Observer MS|UN\+Specialized\+Related Agencies|Government Entity|NSA|IG|Secretariat),/g, "\n$1,")
    .replace(/(?<!Observer)\s+MS,/g, "\nMS,")
    .replace(/\r/g, "");
}

function parseCsvLine(line: string) {
  return line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.trim().replace(/^"|"$/g, "").replaceAll('""', '"')) ?? [];
}

function isCompactEntityRow(cells: string[]) {
  return cells.length <= 3 && Boolean(entityCategory(cells[0])) && Boolean(cells[1]);
}

function compactSpeaker(cells: string[], index: number): Speaker {
  const category = entityCategory(cells[0]) ?? "Observer";
  const name = cells[1] || "Unnamed speaker";
  return {
    id: `imported-${Date.now()}-${index}`,
    fullName: name,
    delegation: name,
    title: cells[2],
    category,
    preferredLanguage: "English",
    status: "available"
  };
}

function entityCategory(value?: string): SpeakerCategory | undefined {
  const code = normalize(value);
  if (["ms", "memberstate", "memberstates", "memberstatecountry"].includes(code)) return "Member State";
  if (["nsa", "nonstateactor", "nonstateactors"].includes(code)) return "Non-State Actor";
  if (["observer", "obs", "observerms", "observermemberstate", "observermemberstates"].includes(code)) return "Observer";
  if (["un", "unentity", "unagency", "unspecializedrelatedagencies", "unspecializedagency", "specializedagency"].includes(code)) return "UN Entity";
  if (["ig", "igo", "intergovernmentalorganization", "intergovernmentalorganizations"].includes(code)) return "Intergovernmental Organization";
  if (["governmententity", "governmententities", "goventity"].includes(code)) return "Government Entity";
  if (["sec", "secretariat"].includes(code)) return "Secretariat";
  return undefined;
}

function normalize(value?: string) {
  return String(value ?? "").trim().replace(/^"|"$/g, "").replace(/[\s_+\-/&]/g, "").toLowerCase();
}
