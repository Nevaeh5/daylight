import type { Data } from "../../domain/tasks";
export const quotes = [
  "不必一下子很厉害，今天前进一小步就好。",
  "你认真生活的样子，我都有看到。",
  "休息也是计划的一部分，慢慢来。",
  "把大大的愿望，拆成今天小小的一步。",
  "今天的你，不需要和任何人比较。",
  "就算只完成一件事，也值得给自己鼓掌。",
  "那些看似普通的日子，也在悄悄发光。",
  "给自己一点耐心，花开有花开的时间。",
  "遇到困难先伸个懒腰，我一直在你身边。",
  "你已经走了很远，记得看看沿途的风景。",
  "允许今天有空白，明天也会有阳光。",
  "你的每一次尝试，都是勇敢的证明。",
];
export function dailyQuoteIndex(day: string) {
  return [...day].reduce((sum, c) => sum * 31 + c.charCodeAt(0), 0) >>> 0;
}
export function quoteFor(day: string, step = 0) {
  return quotes[(dailyQuoteIndex(day) + step) % quotes.length];
}
export type PetAction = "pet" | "feed" | "play";
export function interact(data: Data, action: PetAction, day: string): Data {
  const pet = data.pet || { bond: 0 };
  if (action === "pet") return data;
  const field = action === "feed" ? "fedOn" : "playedOn";
  if (pet[field] === day) return data;
  return {
    ...data,
    pet: { ...pet, [field]: day, bond: Math.min(5, pet.bond + 1) },
  };
}
