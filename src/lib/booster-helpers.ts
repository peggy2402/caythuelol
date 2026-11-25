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
    booster.boosterData?.service_settings ||
    booster.boosterData?.booster_info?.service_settings ||
    booster;

  const workingSchedule = settings?.workingSchedule;
  const scheduleAddon = settings?.addonsConfig?.schedule || settings?.addons?.schedule;

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

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo múi giờ địa phương (local / GMT+7),
 * khắc phục triệt để lỗi new Date().toISOString() bị lùi sang hôm trước vào khung giờ 00:00 - 06:59.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetLocalDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getLocalDateString(d);
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDayOfWeekCode(date: Date): string {
  const day = date.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const map: Record<number, string> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  };
  return map[day] || 'T2';
}

export function getDayOfWeekName(date: Date): string {
  const day = date.getDay();
  const map: Record<number, string> = {
    0: 'Chủ Nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
  };
  return map[day] || 'Thứ 2';
}

export interface ScheduleValidationResult {
  hasConflict: boolean;
  dayConflict: boolean;
  timeConflict: boolean;
  message?: string;
  customerDayName?: string;
  customerDayCode?: string;
  boosterScheduleText?: string;
  suggestedStartDate?: string;
  suggestedTimeWindow?: string;
}

export function validateScheduleWithBooster(
  scheduleDetails: {
    startDate?: string;
    timeWindow?: string;
    customStartTime?: string;
    customEndTime?: string;
  } | undefined,
  booster: any
): ScheduleValidationResult {
  if (!booster || !scheduleDetails || !scheduleDetails.startDate) {
    return {
      hasConflict: false,
      dayConflict: false,
      timeConflict: false,
    };
  }

  const settings =
    booster.booster_info?.service_settings ||
    booster.service_settings ||
    booster.boosterData?.service_settings ||
    booster.boosterData?.booster_info?.service_settings ||
    booster;

  const workingSchedule = settings?.workingSchedule;
  const scheduleAddon = settings?.addonsConfig?.schedule || settings?.addons?.schedule;

  // Lấy danh sách ngày làm việc
  const rawDays: string[] =
    workingSchedule?.daysOfWeek || scheduleAddon?.daysOfWeek || [];
  const normalizedDays = rawDays.map((d: any) =>
    d.toString().toUpperCase().replace('THỨ ', 'T')
  );

  const fromTime = workingSchedule?.fromTime || scheduleAddon?.fromTime;
  const toTime = workingSchedule?.toTime || scheduleAddon?.toTime;
  const boosterScheduleText = getBoosterWorkingScheduleText(booster);

  // 1. Kiểm tra ngày
  const dateObj = parseLocalDate(scheduleDetails.startDate);
  const custDayCode = getDayOfWeekCode(dateObj);
  const custDayName = getDayOfWeekName(dateObj);

  let dayConflict = false;
  if (normalizedDays.length > 0 && normalizedDays.length < 7) {
    const worksOnThisDay = normalizedDays.some(
      (d: string) => d === custDayCode || d === custDayCode.replace('T', '')
    );
    if (!worksOnThisDay) {
      dayConflict = true;
    }
  }

  // 2. Kiểm tra giờ
  let timeConflict = false;
  let custStart = '19:00';
  let custEnd = '23:00';

  if (scheduleDetails.timeWindow === 'CUSTOM') {
    custStart = scheduleDetails.customStartTime || '20:00';
    custEnd = scheduleDetails.customEndTime || '23:00';
  } else if (scheduleDetails.timeWindow) {
    const parts = scheduleDetails.timeWindow.split(/[-–]/).map((s) => s.trim());
    if (parts.length === 2) {
      custStart = parts[0];
      custEnd = parts[1];
    }
  }

  if (fromTime && toTime) {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const bStartMin = toMinutes(fromTime);
    let bEndMin = toMinutes(toTime);
    if (bEndMin < bStartMin) bEndMin += 24 * 60; // qua đêm

    let cStartMin = toMinutes(custStart);
    let cEndMin = toMinutes(custEnd);
    if (cEndMin < cStartMin) cEndMin += 24 * 60;

    if (cStartMin < bStartMin || cEndMin > bEndMin) {
      timeConflict = true;
    }
  }

  const hasConflict = dayConflict || timeConflict;
  let message: string | undefined;

  if (dayConflict && timeConflict) {
    message = `Tuyển thủ không làm việc vào ${custDayName} và khung giờ ${custStart} – ${custEnd} nằm ngoài ca trực (Lịch Booster: ${boosterScheduleText}).`;
  } else if (dayConflict) {
    message = `Tuyển thủ không nhận cày vào ${custDayName} (Lịch Booster: ${boosterScheduleText}).`;
  } else if (timeConflict) {
    message = `Khung giờ bạn chọn (${custStart} – ${custEnd}) nằm ngoài thời gian làm việc của Booster (${fromTime || '08:00'} – ${toTime || '17:30'}).`;
  }

  // Tìm ngày hợp lệ gần nhất của Booster (tính từ hôm nay)
  let suggestedStartDate: string | undefined;
  if (normalizedDays.length > 0 && normalizedDays.length < 7) {
    const today = new Date();
    for (let offset = 0; offset <= 7; offset++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() + offset);
      const code = getDayOfWeekCode(checkDate);
      if (normalizedDays.includes(code) || normalizedDays.includes(code.replace('T', ''))) {
        suggestedStartDate = getLocalDateString(checkDate);
        break;
      }
    }
  }

  const suggestedTimeWindow = fromTime && toTime ? `${fromTime} - ${toTime}` : undefined;

  return {
    hasConflict,
    dayConflict,
    timeConflict,
    message,
    customerDayName: custDayName,
    customerDayCode: custDayCode,
    boosterScheduleText,
    suggestedStartDate,
    suggestedTimeWindow,
  };
}
