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

export interface ExtractedBoosterSchedule {
  workingSchedule?: BoosterWorkingSchedule;
  daysOfWeek: string[]; // ['T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  fromTime: string; // '08:00'
  toTime: string; // '17:30'
  shifts?: string[];
  note?: string;
  scheduleText: string;
}

/**
 * Trích xuất cấu hình lịch làm việc của Booster từ mọi biến thể dữ liệu (user, boosterProfile, boosterData, service_settings)
 */
export function extractBoosterSchedule(booster: any): ExtractedBoosterSchedule {
  if (!booster) {
    return {
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      fromTime: '08:00',
      toTime: '17:30',
      scheduleText: 'Làm từ 8:00 -> 17:30 hàng ngày',
    };
  }

  // Quét toàn bộ mọi cấu trúc dữ liệu lồng nhau có thể có
  const settings =
    booster.booster_info?.service_settings ||
    booster.service_settings ||
    booster.boosterData?.service_settings ||
    booster.boosterData?.booster_info?.service_settings ||
    booster.boosterData?.boosterProfile?.service_settings ||
    booster.boosterProfile?.service_settings ||
    booster.user?.service_settings ||
    booster.user?.booster_info?.service_settings ||
    booster.user?.boosterProfile?.service_settings ||
    (booster.workingSchedule ? booster : null);

  const workingSchedule = settings?.workingSchedule || booster.workingSchedule;
  const scheduleAddon =
    settings?.addonsConfig?.schedule ||
    settings?.addons?.schedule ||
    booster.addonsConfig?.schedule;

  let note = (workingSchedule?.note || scheduleAddon?.customHours || '').trim();

  // 1. Phân tích danh sách ngày
  let daysOfWeek: string[] =
    workingSchedule?.daysOfWeek || scheduleAddon?.daysOfWeek || [];
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    if (note) {
      const lowerNote = note.toLowerCase();
      if (lowerNote.includes('trừ cn') || lowerNote.includes('t2 - t7')) {
        daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      } else if (lowerNote.includes('thứ 7, cn') || lowerNote.includes('cuối tuần')) {
        daysOfWeek = ['T7', 'CN'];
      } else if (lowerNote.includes('hàng ngày') || lowerNote.includes('cả tuần')) {
        daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      }
    }
  }

  // 2. Phân tích giờ bắt đầu / kết thúc
  let fromTime = (workingSchedule?.fromTime || scheduleAddon?.fromTime || '').trim();
  let toTime = (workingSchedule?.toTime || scheduleAddon?.toTime || '').trim();

  if ((!fromTime || !toTime) && note) {
    const timeMatch = note.match(/(\d{1,2}:\d{2})\s*(?:->|-|–|đến)\s*(\d{1,2}:\d{2})/);
    if (timeMatch) {
      if (!fromTime) fromTime = timeMatch[1].padStart(5, '0');
      if (!toTime) toTime = timeMatch[2].padStart(5, '0');
    }
  }

  if (!fromTime) fromTime = '08:00';
  if (!toTime) toTime = '17:30';
  if (daysOfWeek.length === 0) {
    daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  }

  const shifts = workingSchedule?.shifts || scheduleAddon?.shifts;
  const scheduleText =
    note || generateWorkingScheduleNote(fromTime, toTime, daysOfWeek);

  return {
    workingSchedule,
    daysOfWeek,
    fromTime,
    toTime,
    shifts,
    note,
    scheduleText,
  };
}

export function getBoosterWorkingScheduleText(booster: any): string {
  if (!booster) return 'Làm từ 8:00 -> 17:30 hàng ngày';
  return extractBoosterSchedule(booster).scheduleText;
}

/**
 * Trả về định dạng rút gọn tinh gọn cho thẻ Booster (ví dụ: T2 – T7 • 08:00 – 17:30 (trừ CN))
 */
export function getBoosterConciseScheduleText(booster: any): string {
  if (!booster) return 'Hàng ngày • 08:00 – 17:30';
  const { fromTime, toTime, daysOfWeek } = extractBoosterSchedule(booster);
  const timeRange = `${fromTime || '08:00'} – ${toTime || '17:30'}`;

  const daysSet = new Set(daysOfWeek || []);
  if (daysSet.size >= 7 || (daysSet.has('T2') && daysSet.has('CN') && daysSet.size >= 7)) {
    return `Hàng ngày • ${timeRange}`;
  }
  if (daysSet.has('T2') && daysSet.has('T7') && !daysSet.has('CN') && daysSet.size === 6) {
    return `T2 – T7 • ${timeRange} (trừ CN)`;
  }
  if (daysSet.has('T7') && daysSet.has('CN') && daysSet.size === 2) {
    return `T7 – CN • ${timeRange}`;
  }
  if (daysOfWeek && daysOfWeek.length > 0) {
    return `${daysOfWeek.join(', ')} • ${timeRange}`;
  }
  return `Hàng ngày • ${timeRange}`;
}

export function checkIfShiftConflictsWithBooster(shiftId: string, booster: any): boolean {
  if (!booster) return false;
  const { fromTime, toTime } = extractBoosterSchedule(booster);
  const parts = shiftId.split(/[-–]/).map((s) => s.trim());
  if (parts.length !== 2) return false;

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const bStartMin = toMinutes(fromTime);
  let bEndMin = toMinutes(toTime);
  if (bEndMin < bStartMin) bEndMin += 24 * 60;

  let cStartMin = toMinutes(parts[0]);
  let cEndMin = toMinutes(parts[1]);
  if (cEndMin < cStartMin) cEndMin += 24 * 60;

  return cStartMin < bStartMin || cEndMin > bEndMin;
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

  const { daysOfWeek, fromTime, toTime, scheduleText } = extractBoosterSchedule(booster);
  const normalizedDays = daysOfWeek.map((d: any) =>
    d.toString().toUpperCase().replace('THỨ ', 'T')
  );
  const boosterScheduleText = scheduleText;

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
    message = `Booster không làm việc vào ${custDayName} và khung giờ ${custStart} – ${custEnd} nằm ngoài ca trực (Lịch Booster: ${boosterScheduleText}).`;
  } else if (dayConflict) {
    message = `Booster không nhận cày vào ${custDayName} (Lịch Booster: ${boosterScheduleText}).`;
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
