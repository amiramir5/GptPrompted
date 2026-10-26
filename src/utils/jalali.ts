// Pure zero-dependency Jalali (Shamsi) algorithm and formatting utilities

export interface JalaliDate {
  gy: number;
  gm: number;
  gd: number;
  jy: number;
  jm: number;
  jd: number;
  dayName: string;
  monthName: string;
  formatted: string;
  isoDate: string; // YYYY-MM-DD
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

export function toJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  return { gy, gm, gd: days + 1 };
}

export function getJalaliInfo(date: Date = new Date()): JalaliDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const { jy, jm, jd } = toJalali(gy, gm, gd);

  const dayIndex = date.getDay(); // 0 is Sunday
  const dayName = PERSIAN_WEEKDAYS[dayIndex];
  const monthName = PERSIAN_MONTHS[jm - 1];

  const formatted = `${dayName} ${jd} ${monthName} ${jy}`;
  const isoDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;

  return {
    gy,
    gm,
    gd,
    jy,
    jm,
    jd,
    dayName,
    monthName,
    formatted,
    isoDate,
  };
}

export function formatPersianNumber(val: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(val).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export function formatDurationHoursMinutes(minutes: number): { hours: number; mins: number; formatted: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formatted = hours > 0 ? `${hours} ساعت و ${mins} دقیقه` : `${mins} دقیقه`;
  return { hours, mins, formatted };
}

export function formatSecondsToTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getTodayISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getWeekDays(centerDate: Date = new Date()): { date: Date; isoDate: string; jalali: JalaliDate; isToday: boolean }[] {
  const todayISO = getTodayISODate();
  const result = [];
  const current = new Date(centerDate);
  // Find previous Saturday (Iranian week start)
  const dayOfWeek = current.getDay(); // 0: Sun, 6: Sat
  const diffToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Sat -> 0, Sun -> 1, Mon -> 2...
  current.setDate(current.getDate() - diffToSaturday);

  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    d.setDate(current.getDate() + i);
    const jalali = getJalaliInfo(d);
    result.push({
      date: d,
      isoDate: jalali.isoDate,
      jalali,
      isToday: jalali.isoDate === todayISO,
    });
  }
  return result;
}
