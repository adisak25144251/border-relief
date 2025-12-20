import { nanoid, customAlphabet } from 'nanoid';

/**
 * สร้าง Trip ID แบบ T-XXXX (เช่น T-0001, T-9999)
 */
export function generateTripId(): string {
    const number = Math.floor(Math.random() * 10000);
    return `T-${number.toString().padStart(4, '0')}`;
}

/**
 * สร้าง Vehicle ID แบบ V-XXXX
 */
export function generateVehicleId(): string {
    const number = Math.floor(Math.random() * 10000);
    return `V-${number.toString().padStart(4, '0')}`;
}

/**
 * สร้าง Audit Log ID แบบ LOG-XXXX
 */
export function generateAuditLogId(): string {
    const number = Math.floor(Math.random() * 100000);
    return `LOG-${number.toString().padStart(5, '0')}`;
}

/**
 * สร้าง Document ID แบบปลอดภัย (URL-safe)
 */
export function generateDocumentId(length: number = 16): string {
    return nanoid(length);
}

/**
 * สร้าง Share Link Token (URL-safe, ไม่มีตัวอักษรคล้ายกัน)
 */
export function generateShareToken(length: number = 32): string {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz';
    const generate = customAlphabet(alphabet, length);
    return generate();
}

/**
 * สร้าง User ID แบบ U-XXXX
 */
export function generateUserId(): string {
    const number = Math.floor(Math.random() * 100000);
    return `U-${number.toString().padStart(5, '0')}`;
}

/**
 * สร้าง UUID v4
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * ตรวจสอบรูปแบบ Trip ID
 */
export function isValidTripId(id: string): boolean {
    return /^T-\d{4}$/.test(id);
}

/**
 * ตรวจสอบรูปแบบ Vehicle ID
 */
export function isValidVehicleId(id: string): boolean {
    return /^V-\d{4}$/.test(id);
}

/**
 * ตรวจสอบรูปแบบ Audit Log ID
 */
export function isValidAuditLogId(id: string): boolean {
    return /^LOG-\d{5}$/.test(id);
}

/**
 * แยก number จาก Trip ID
 */
export function extractTripNumber(id: string): number | null {
    const match = id.match(/^T-(\d{4})$/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * สร้าง Short ID สำหรับการแชร์ (8 ตัวอักษร)
 */
export function generateShortId(): string {
    return nanoid(8);
}
