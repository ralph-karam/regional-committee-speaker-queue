import { Speaker, SpeakerCategory, SpeakerStatus } from "@/lib/types";

const categories: SpeakerCategory[] = ["Member State", "Observer", "UN Entity", "Intergovernmental Organization", "Secretariat"];
const statuses: SpeakerStatus[] = ["available", "queued", "speaking", "completed", "unavailable"];

export function parseSpeakerCsv(csv: string): Speaker[] {
  const rows = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [, ...data] = rows;
  return data.map((line, index) => {
    const cells = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, "").replaceAll('""', '"')) ?? [];
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
