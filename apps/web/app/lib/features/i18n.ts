/**
 * Internationalization (i18n) Module
 * Multi-language TH/EN support
 */

export type SupportedLocale = 'th' | 'en';

export interface TranslationDict {
    [key: string]: string | TranslationDict;
}

/**
 * Thai translations
 */
export const translations_th: TranslationDict = {
    common: {
        save: 'บันทึก',
        cancel: 'ยกเลิก',
        delete: 'ลบ',
        edit: 'แก้ไข',
        search: 'ค้นหา',
        filter: 'กรอง',
        export: 'ส่งออก',
        import: 'นำเข้า',
        download: 'ดาวน์โหลด',
        upload: 'อัปโหลด',
        loading: 'กำลังโหลด...',
        error: 'เกิดข้อผิดพลาด',
        success: 'สำเร็จ',
        confirm: 'ยืนยัน',
        back: 'ย้อนกลับ',
        next: 'ถัดไป',
        previous: 'ก่อนหน้า',
        total: 'รวม',
    },

    trip: {
        title: 'ภารกิจ',
        date: 'วันที่',
        startLocation: 'จุดเริ่มต้น',
        endLocation: 'จุดหมาย',
        distance: 'ระยะทาง',
        km: 'กิโลเมตร',
        totalCost: 'ต้นทุนรวม',
        baht: 'บาท',
        status: 'สถานะ',
        vehicle: 'ยานพาหนะ',
        driver: 'ผู้ขับขี่',

        statuses: {
            pending: 'รออนุมัติ',
            approved: 'อนุมัติแล้ว',
            verified: 'ตรวจสอบแล้ว',
            cancelled: 'ยกเลิก',
        },

        costs: {
            fuel: 'น้ำมันเชื้อเพลิง',
            allowance: 'ค่าเบี้ยเลี้ยง',
            accommodation: 'ค่าที่พัก',
            depreciation: 'ค่าเสื่อมราคา',
            maintenance: 'ค่าบำรุงรักษา',
        },
    },

    dashboard: {
        title: 'แดชบอร์ด',
        overview: 'ภาพรวม',
        totalTrips: 'ทริปทั้งหมด',
        totalDistance: 'ระยะทางรวม',
        totalCost: 'ต้นทุนรวม',
        averageCost: 'ต้นทุนเฉลี่ย',
        thisMonth: 'เดือนนี้',
        lastMonth: 'เดือนที่แล้ว',
        thisYear: 'ปีนี้',
    },

    reports: {
        title: 'รายงาน',
        generate: 'สร้างรายงาน',
        daily: 'รายวัน',
        weekly: 'รายสัปดาห์',
        monthly: 'รายเดือน',
        quarterly: 'รายไตรมาส',
        annual: 'รายปี',
        summary: 'สรุป',
        detailed: 'รายละเอียด',
    },

    menu: {
        home: 'หน้าหลัก',
        trips: 'จัดการทริป',
        fleet: 'จัดการยานพาหนะ',
        reports: 'รายงาน',
        analytics: 'วิเคราะห์ข้อมูล',
        settings: 'ตั้งค่า',
        logout: 'ออกจากระบบ',
    },

    validation: {
        required: 'กรุณากรอก{field}',
        invalid: '{field}ไม่ถูกต้อง',
        tooShort: '{field}สั้นเกินไป',
        tooLong: '{field}ยาวเกินไป',
        outOfRange: '{field}อยู่นอกช่วงที่กำหนด',
    },

    errors: {
        networkError: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์',
        unauthorized: 'คุณไม่มีสิทธิ์เข้าถึง',
        notFound: 'ไม่พบข้อมูล',
        serverError: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์',
        validationError: 'ข้อมูลไม่ถูกต้อง',
    },
};

/**
 * English translations
 */
export const translations_en: TranslationDict = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        download: 'Download',
        upload: 'Upload',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        total: 'Total',
    },

    trip: {
        title: 'Mission',
        date: 'Date',
        startLocation: 'Start Location',
        endLocation: 'Destination',
        distance: 'Distance',
        km: 'kilometers',
        totalCost: 'Total Cost',
        baht: 'Baht',
        status: 'Status',
        vehicle: 'Vehicle',
        driver: 'Driver',

        statuses: {
            pending: 'Pending Approval',
            approved: 'Approved',
            verified: 'Verified',
            cancelled: 'Cancelled',
        },

        costs: {
            fuel: 'Fuel',
            allowance: 'Allowance',
            accommodation: 'Accommodation',
            depreciation: 'Depreciation',
            maintenance: 'Maintenance',
        },
    },

    dashboard: {
        title: 'Dashboard',
        overview: 'Overview',
        totalTrips: 'Total Trips',
        totalDistance: 'Total Distance',
        totalCost: 'Total Cost',
        averageCost: 'Average Cost',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        thisYear: 'This Year',
    },

    reports: {
        title: 'Reports',
        generate: 'Generate Report',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        annual: 'Annual',
        summary: 'Summary',
        detailed: 'Detailed',
    },

    menu: {
        home: 'Home',
        trips: 'Trip Management',
        fleet: 'Fleet Management',
        reports: 'Reports',
        analytics: 'Analytics',
        settings: 'Settings',
        logout: 'Logout',
    },

    validation: {
        required: 'Please enter {field}',
        invalid: 'Invalid {field}',
        tooShort: '{field} is too short',
        tooLong: '{field} is too long',
        outOfRange: '{field} is out of range',
    },

    errors: {
        networkError: 'Cannot connect to server',
        unauthorized: 'Unauthorized access',
        notFound: 'Not found',
        serverError: 'Server error occurred',
        validationError: 'Validation error',
    },
};

/**
 * Get all translations
 */
export const translations: Record<SupportedLocale, TranslationDict> = {
    th: translations_th,
    en: translations_en,
};

/**
 * Translation function
 */
export function t(
    key: string,
    locale: SupportedLocale = 'th',
    params?: Record<string, string>
): string {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if not found
        }
    }

    if (typeof value !== 'string') {
        return key;
    }

    // Replace parameters
    if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            value = value.replace(`{${paramKey}}`, paramValue);
        });
    }

    return value;
}

/**
 * Format number with locale
 */
export function formatNumber(
    num: number,
    locale: SupportedLocale = 'th',
    options?: Intl.NumberFormatOptions
): string {
    const localeStr = locale === 'th' ? 'th-TH' : 'en-US';
    return new Intl.NumberFormat(localeStr, options).format(num);
}

/**
 * Format currency
 */
export function formatCurrency(
    amount: number,
    locale: SupportedLocale = 'th'
): string {
    return formatNumber(amount, locale, {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
    });
}

/**
 * Format date
 */
export function formatDate(
    date: Date | string,
    locale: SupportedLocale = 'th',
    format: 'short' | 'long' | 'full' = 'short'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const localeStr = locale === 'th' ? 'th-TH' : 'en-US';

    const options: Intl.DateTimeFormatOptions =
        format === 'short'
            ? { year: 'numeric', month: '2-digit', day: '2-digit' }
            : format === 'long'
                ? { year: 'numeric', month: 'long', day: 'numeric' }
                : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    return d.toLocaleDateString(localeStr, options);
}

/**
 * Format distance
 */
export function formatDistance(
    km: number,
    locale: SupportedLocale = 'th'
): string {
    const unit = t('trip.km', locale);
    return `${formatNumber(km, locale, { minimumFractionDigits: 2 })} ${unit}`;
}

/**
 * Detect browser locale
 */
export function detectLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'th';

    const browserLocale = window.navigator.language.toLowerCase();

    if (browserLocale.startsWith('th')) return 'th';
    return 'en';
}

/**
 * Get locale from storage
 */
export function getStoredLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'th';

    const stored = localStorage.getItem('locale');
    if (stored === 'th' || stored === 'en') return stored;

    return detectLocale();
}

/**
 * Set locale in storage
 */
export function setStoredLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('locale', locale);
}

/**
 * Get direction for locale (LTR/RTL)
 */
export function getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
    // Both TH and EN are LTR
    return 'ltr';
}
