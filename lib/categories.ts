import { SpeakerCategory } from "@/lib/types";

export const defaultSpeakerCategories: SpeakerCategory[] = [
  "Member State",
  "Non-State Actor",
  "Observer",
  "UN Entity",
  "Intergovernmental Organization",
  "Government Entity",
  "Secretariat"
];

export function mergeCategories(...groups: Array<Array<SpeakerCategory | undefined>>) {
  return Array.from(new Set(groups.flat().filter(Boolean) as SpeakerCategory[]));
}
