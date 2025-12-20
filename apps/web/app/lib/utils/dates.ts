import { format, addDays, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * แปลงวันที่เป็นรูปแบบไทย (พ.ศ.)
 */
export function formatThaiDate(date: Date | string, formatStr: string = 'dd MMM yyyy'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const formatted = format(d, formatStr, { locale: th });

    // Convert to Buddhist Era
    const year = d.getFullYear() + 543;
    return formatted.replace(d.getFullYear().toString(), year.toString());
}

/**
 * แปลงวันที่เป็นรูปแบบสั้น (เช่น "20 ธ.ค. 68")
 */
export function formatThaiDateShort(date: Date | string): string {
    return formatThaiDate(date, 'dd MMM yy');
}

/**
 * แปลงวันที่เป็นรูปแบบยาว (เช่น "20 ธันวาคม 2568")
 */
export function formatThaiDateLong(date: Date | string): string {
    return formatThaiDate(date, 'dd MMMM yyyy');
}

/**
 * ตรวจสอบว่าวันที่อยู่ในปีงบประมาณเดียวกันหรือไม่
 * ปีงบประมาณไทย: 1 ต.ค. - 30 ก.ย.
 */
export function isSameFiscalYear(date1: Date, date2: Date): boolean {
    const fy1 = getFiscalYear(date1);
    const fy2 = getFiscalYear(date2);
    return fy1 === fy2;
}

/**
 * หาปีงบประมาณ (เริ่ม 1 ต.ค.)
 */
export function getFiscalYear(date: Date): number {
    const month = date.getMonth();
    const year = date.getFullYear();
    return month >= 9 ? year + 1 : year; // ตุลาคม (month 9) เป็นเดือนแรกของปีงบฯ
}

/**
 * หาวันแรกและวันสุดท้ายของปีงบประมาณ
 */
export function getFiscalYearRange(fiscalYear: number): { start: Date; end: Date } {
    const start = new Date(fiscalYear - 1, 9, 1); // 1 ต.ค. ปีก่อน
    const end = new Date(fiscalYear, 8, 30); // 30 ก.ย. ปีปัจจุบัน
    return { start, end };
}

/**
 * คำนวณจำนวนวันระหว่างสองวันที่
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
    const d1 = typeof start === 'string' ? new Date(start) : start;
    const d2 = typeof end === 'string' ? new Date(end) : end;
    return differenceInDays(d2, d1);
}

/**
 * ตรวจสอบว่าวันที่อยู่ในช่วงที่กำหนดหรือไม่
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
}

/**
 * แปลง Buddhist Era เป็น Christian Era
 */
export function beToAd(year: number): number {
    return year - 543;
}

/**
 * แปลง Christian Era เป็น Buddhist Era
 */
export function adToBe(year: number): number {
    return year + 543;
}

/**
 * สร้างวันที่วันนี้เวลา 00:00:00
 */
export function getToday(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
}

/**
 * หาวันแรกและวันสุดท้ายของเดือนปัจจุบัน
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    return {
        start: startOfMonth(now),
        end: endOfMonth(now),
    };
}
