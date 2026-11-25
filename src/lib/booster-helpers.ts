// src/lib/booster-helpers.ts

export interface BoosterWorkingSchedule {
  enabled?: boolean;
  daysOfWeek?: string[]; // e.g. ['T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  fromTime?: string; // '08:00'
  toTime?: string; // '17:30'
  shifts?: string[]; // ['morning', 'afternoon', 'evening', 'night']
  note?: string; // 'Làm từ 8:00 -> 17:30 các ngày trong tuần trừ CN'
  allowScheduledBoost?: boolean;
  scheduleSurchargePercent?: number;
}

export const ALL_WEEKDAYS = [
  { id: 'T2', label: 'T2' },
  { id: 'T3', label: 'T3' },
  { id: 'T4', label: 'T4' },
  { id: 'T5', label: 'T5' },
  { id: 'T6', label: 'T6' },
  { id: 'T7', label: 'T7' },
  { id: 'CN', label: 'CN' },
];

export function formatWorkingDays(days?: string[]): string {
  if (!days || days.length === 0 || days.length === 7) return 'Hàng ngày';

  const normalized = days.map((d) => d.toString().toUpperCase().replace('THỨ ', 'T'));
  const hasCN = normalized.includes('CN') || normalized.includes('1') || normalized.includes('SUN');

  const allWeekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const hasAllWeekdays = allWeekdays.every(
    (d) => normalized.includes(d) || normalized.includes(d.replace('T', ''))
  );

  if (hasAllWeekdays && !hasCN) {
    return 'các ngày trong tuần trừ CN';
  }

  const isWeekendOnly =
    (normalized.includes('T7') || normalized.includes('7')) &&
    hasCN &&
    normalized.length === 2;
  if (isWeekendOnly) {
    return 'Thứ 7, CN';
  }

  const orderMap: Record<string, number> = {
    T2: 2,
    T3: 3,
    T4: 4,
    T5: 5,
    T6: 6,
    T7: 7,
    CN: 8,
  };
  const sortedDays = [...normalized].sort(
    (a, b) => (orderMap[a] || 99) - (orderMap[b] || 99)
  );

  const formattedDays = sortedDays
    .map((d) => (d === 'CN' ? 'CN' : d.replace('T', '')))
    .join(', ');

  return `Thứ ${formattedDays}`;
}

export function generateWorkingScheduleNote(
  fromTime: string = '08:00',
  toTime: string = '17:30',
  days: string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7']
): string {
  const formatTimePart = (t: string) => {
    return (t || '').replace(/^0(\d:)/, '$1');
  };
  const from = formatTimePart(fromTime || '08:00');
  const to = formatTimePart(toTime || '17:30');
  const daysText = formatWorkingDays(days);

  if (daysText === 'Hàng ngày') {
    return `Làm từ ${from} -> ${to} hàng ngày`;
  }
  if (daysText === 'các ngày trong tuần trừ CN') {
    return `Làm từ ${from} -> ${to} các ngày trong tuần trừ CN`;
  }
  if (daysText === 'Thứ 7, CN') {
    return `Làm từ ${from} -> ${to} Thứ 7, CN`;
  }

  return `Làm từ ${from} -> ${to} ${daysText}`;
}

export function getBoosterWorkingScheduleText(booster: any): string {
  if (!booster) return 'Làm từ 8:00 -> 17:30 hàng ngày';

  const settings =
    booster.booster_info?.service_settings ||
    booster.service_settings ||
    booster;

  const workingSchedule = settings?.workingSchedule;
  const scheduleAddon = settings?.addonsConfig?.schedule;

  // 1. Explicit note if customized
  if (workingSchedule?.note && workingSchedule.note.trim()) {
    return workingSchedule.note.trim();
  }
  if (scheduleAddon?.customHours && scheduleAddon.customHours.trim()) {
    return scheduleAddon.customHours.trim();
  }

  // 2. Structured fromTime & toTime & daysOfWeek
  const fromTime = workingSchedule?.fromTime || scheduleAddon?.fromTime || '08:00';
  const toTime = workingSchedule?.toTime || scheduleAddon?.toTime || '17:30';
  const days = workingSchedule?.daysOfWeek || scheduleAddon?.daysOfWeek;

  if (days && days.length > 0) {
    return generateWorkingScheduleNote(fromTime, toTime, days);
  }

  // 3. Shift badges
  const shifts = workingSchedule?.shifts || scheduleAddon?.shifts;
  if (Array.isArray(shifts) && shifts.length > 0) {
    const shiftNames = shifts.map((s: string) => {
      if (s === 'morning') return 'Sáng (08-12h)';
      if (s === 'afternoon') return 'Chiều (13-17h)';
      if (s === 'evening') return 'Tối (19-23h)';
      if (s === 'night') return 'Đêm (23-04h)';
      return s;
    });
    return `Ca: ${shiftNames.join(', ')}`;
  }

  return 'Làm từ 8:00 -> 17:30 hàng ngày';
}
