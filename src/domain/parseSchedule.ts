import { daySchema, localDay, shiftDay } from "./tasks";

const numerals: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};
function number(text: string) {
  if (/^\d+$/.test(text)) return Number(text);
  if (text.includes("十")) {
    const [a, b] = text.split("十");
    return (a ? numerals[a] : 1) * 10 + (b ? numerals[b] : 0);
  }
  return numerals[text];
}
export function parseSchedule(input: string, now = new Date()) {
  let title = input.trim();
  let date = localDay(now),
    time = "",
    hasDate = false;
  const warnings: string[] = [];
  const take = (match: RegExpMatchArray) => {
    title = title.replace(match[0], " ");
  };
  const relative = title.match(/大后天|后天|明天|今天/);
  const explicit = title.match(
    /(?:(\d{4})[-/年])?(\d{1,2})[-/月](\d{1,2})(?:日|号)?/,
  );
  const week = title.match(/(下下|下|本|这)?(?:周|星期)([一二三四五六日天])/);
  if (relative) {
    date = shiftDay(
      date,
      { 今天: 0, 明天: 1, 后天: 2, 大后天: 3 }[relative[0]]!,
    );
    hasDate = true;
    take(relative);
  } else if (explicit) {
    let year = Number(explicit[1] || now.getFullYear());
    const format = () =>
      `${year}-${explicit[2].padStart(2, "0")}-${explicit[3].padStart(2, "0")}`;
    date = format();
    if (
      !explicit[1] &&
      daySchema.safeParse(date).success &&
      date < localDay(now)
    ) {
      year++;
      date = format();
    }
    hasDate = true;
    take(explicit);
    if (!daySchema.safeParse(date).success) {
      date = localDay(now);
      warnings.push("日期无效，请修改后再保存。");
    }
  } else if (week) {
    const target = "一二三四五六日".indexOf(week[2] === "天" ? "日" : week[2]);
    const current = (now.getDay() + 6) % 7;
    let delta =
      target - current + (week[1] === "下下" ? 14 : week[1] === "下" ? 7 : 0);
    if (!week[1] && delta < 0) delta += 7;
    date = shiftDay(date, delta);
    hasDate = true;
    take(week);
  }
  const clock = title.match(
    /(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|今晚)?\s*(\d{1,2}|[零〇一二两三四五六七八九十]{1,3})(?:[:：](\d{2})|[点时](?:\s*(半|一刻|三刻|\d{1,2}|[零〇一二两三四五六七八九十]{1,3})分?)?)/,
  );
  if (clock) {
    let hour = number(clock[2]);
    const minute = clock[3]
      ? Number(clock[3])
      : clock[4] === "半"
        ? 30
        : clock[4] === "一刻"
          ? 15
          : clock[4] === "三刻"
            ? 45
            : clock[4]
              ? number(clock[4])
              : 0;
    const period = clock[1];
    if (period && /下午|傍晚|晚上|今晚/.test(period) && hour < 12) hour += 12;
    if (period === "中午" && hour < 11) hour += 12;
    if (period && /凌晨|早上|早晨|上午/.test(period) && hour === 12) hour = 0;
    if (hour > 23 || minute > 59 || !Number.isFinite(hour + minute))
      warnings.push("时间无效，请修改后再保存。");
    else
      time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    if (!period && hour >= 1 && hour <= 12)
      warnings.push("未说明上午或下午，请核对时间。");
    take(clock);
  }
  if (!hasDate) warnings.push("没有明确日期，暂按今天填写。");
  if (!time) warnings.push("没有识别到具体时间，请补充时间后设置提醒。");
  title = title
    .replace(/提前\s*(?:15|十五)\s*分钟提醒(?:我)?/g, " ")
    .replace(/^\s*(?:提醒我|帮我|请)\s*/, "")
    .replace(/^[\s，,。]+|[\s，,。]+$/g, "")
    .replace(/\s+/g, " ");
  return { title, date, time, warnings };
}
