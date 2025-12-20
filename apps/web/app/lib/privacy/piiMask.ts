/**
 * PII (Personally Identifiable Information) Masking Module
 * สำหรับปกป้องข้อมูลส่วนบุคคลตาม PDPA
 */

/**
 * Mask ชื่อบุคคล (แสดงเฉพาะตัวอักษรแรกและสุดท้าย)
 */
export function maskName(name: string): string {
    if (!name || name.length < 2) return '***';

    const parts = name.trim().split(' ');
    const maskedParts = parts.map(part => {
        if (part.length <= 2) return part[0] + '*';
        return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    });

    return maskedParts.join(' ');
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.***';

    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2
        ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
        : local[0] + '*';

    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2
        ? domainName[0] + '*'.repeat(domainName.length - 2) + domainName[domainName.length - 1]
        : domainName;

    return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
 * Mask phone number (แสดงเฉพาะ 3 หลักแรกและ 2 หลักสุดท้าย)
 */
export function maskPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 6) return '***-***-****';
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-***-**${cleaned.slice(-2)}`;
    }

    return cleaned.slice(0, 3) + '*'.repeat(cleaned.length - 5) + cleaned.slice(-2);
}

/**
 * Mask ทะเบียนรถ (แสดงเฉพาะจังหวัด)
 */
export function maskLicensePlate(plate: string): string {
    // รูปแบบ: "กข-1234 กรุงเทพ" -> "**-**** กรุงเทพ"
    const parts = plate.split(' ');
    if (parts.length < 2) return '**-****';

    const maskedNumber = parts[0].split('-').map(() => '**').join('-');
    return `${maskedNumber} ${parts[1]}`;
}

/**
 * Mask GPS coordinates (ลดความแม่นยำ)
 */
export function maskGPSCoordinate(lat: number, lng: number, precision: number = 2): {
    lat: number;
    lng: number;
} {
    const factor = Math.pow(10, precision);
    return {
        lat: Math.round(lat * factor) / factor,
        lng: Math.round(lng * factor) / factor,
    };
}

/**
 * Mask location name (แสดงเฉพาะเขต/อำเภอ)
 */
export function maskLocation(fullLocation: string): string {
    // ตัวอย่าง: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110"
    // -> "เขตคลองเตย กรุงเทพมหานคร"

    const parts = fullLocation.split(',').map(p => p.trim());

    // หาส่วนที่เป็น เขต/อำเภอ และ จังหวัด
    const district = parts.find(p => p.includes('เขต') || p.includes('อำเภอ')) || '***';
    const province = parts.find(p =>
        p.includes('กรุงเทพ') ||
        p.includes('จังหวัด') ||
        p.length > 10
    ) || '***';

    return `${district} ${province}`.trim();
}

/**
 * Mask ID card number
 */
export function maskIDCard(idCard: string): string {
    const cleaned = idCard.replace(/\D/g, '');

    if (cleaned.length !== 13) return '*-****-*****-**-*';

    // รูปแบบ: X-XXXX-XXXXX-XX-X -> X-****-*****-**-X
    return `${cleaned[0]}-****-*****-**-${cleaned[12]}`;
}

/**
 * Apply PII masking to trip data
 */
export interface MaskedTrip {
    id: string;
    title: string;
    driver?: string; // masked
    vehicle?: string; // masked license plate
    startLocation: string; // masked
    endLocation: string; // masked
    distance: number;
    date: string;
    // Note: sensitive fields removed
}

export function maskTripData(trip: any): MaskedTrip {
    return {
        id: trip.id,
        title: trip.title,
        driver: trip.driver ? maskName(trip.driver) : undefined,
        vehicle: trip.vehicle ? maskLicensePlate(trip.vehicle) : undefined,
        startLocation: maskLocation(trip.startLocation || ''),
        endLocation: maskLocation(trip.endLocation || ''),
        distance: trip.distance,
        date: trip.date,
    };
}

/**
 * Check if data contains PII
 */
export function containsPII(text: string): {
    hasPII: boolean;
    types: string[];
} {
    const types: string[] = [];

    // Check for email
    if (/@\w+\.\w+/.test(text)) types.push('email');

    // Check for phone (Thai format)
    if (/0\d{1,2}[-\s]?\d{3}[-\s]?\d{4}/.test(text)) types.push('phone');

    // Check for ID card
    if (/\d{1}-?\d{4}-?\d{5}-?\d{2}-?\d{1}/.test(text)) types.push('id_card');

    // Check for coordinates (approximate)
    if (/\d{1,3}\.\d+,\s*\d{1,3}\.\d+/.test(text)) types.push('coordinates');

    return {
        hasPII: types.length > 0,
        types,
    };
}

/**
 * Auto-detect and mask PII in text
 */
export function autoMaskPII(text: string): string {
    let masked = text;

    // Mask emails
    masked = masked.replace(/[\w.-]+@[\w.-]+\.\w+/g, (match) => maskEmail(match));

    // Mask phone numbers
    masked = masked.replace(/0\d{1,2}[-\s]?\d{3}[-\s]?\d{4}/g, (match) => maskPhoneNumber(match));

    // Mask ID cards
    masked = masked.replace(/\d{1}-?\d{4}-?\d{5}-?\d{2}-?\d{1}/g, (match) => maskIDCard(match));

    return masked;
}
