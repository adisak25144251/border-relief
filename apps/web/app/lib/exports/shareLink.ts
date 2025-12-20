import { generateShareToken } from '../utils/id';

/**
 * Share link configuration
 */
export interface ShareLinkConfig {
    tripId: string;
    expiresIn?: number; // seconds
    permissions?: 'view' | 'edit';
    requirePassword?: boolean;
    password?: string;
}

export interface ShareLink {
    id: string;
    token: string;
    url: string;
    tripId: string;
    createdAt: Date;
    expiresAt: Date;
    permissions: 'view' | 'edit';
    accessCount: number;
    maxAccess?: number;
    isActive: boolean;
    requirePassword: boolean;
    passwordHash?: string;
}

/**
 * Generate shareable link for trip
 */
export function generateShareLink(config: ShareLinkConfig, baseUrl: string = window.location.origin): ShareLink {
    const token = generateShareToken(32);
    const expiresIn = config.expiresIn || 7 * 24 * 60 * 60; // 7 days default
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresIn * 1000);

    const url = `${baseUrl}/share/${token}`;

    return {
        id: `SH-${Date.now()}`,
        token,
        url,
        tripId: config.tripId,
        createdAt,
        expiresAt,
        permissions: config.permissions || 'view',
        accessCount: 0,
        isActive: true,
        requirePassword: config.requirePassword || false,
        passwordHash: config.password ? hashPassword(config.password) : undefined,
    };
}

/**
 * Simple password hashing (in production, use bcrypt)
 */
function hashPassword(password: string): string {
    // This is a placeholder - in production use bcrypt or similar
    return btoa(password);
}

/**
 * Verify share link access
 */
export function verifyShareLink(
    shareLink: ShareLink,
    password?: string
): { valid: boolean; error?: string } {
    // Check if active
    if (!shareLink.isActive) {
        return { valid: false, error: 'ลิงก์นี้ถูกยกเลิกแล้ว' };
    }

    // Check expiration
    if (new Date() > shareLink.expiresAt) {
        return { valid: false, error: 'ลิงก์หมดอายุแล้ว' };
    }

    // Check max access
    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
        return { valid: false, error: 'ลิงก์ถูกใช้งานครบจำนวนที่กำหนดแล้ว' };
    }

    // Check password
    if (shareLink.requirePassword) {
        if (!password) {
            return { valid: false, error: 'ต้องระบุรหัสผ่าน' };
        }
        if (hashPassword(password) !== shareLink.passwordHash) {
            return { valid: false, error: 'รหัสผ่านไม่ถูกต้อง' };
        }
    }

    return { valid: true };
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Generate QR code URL for share link
 */
export function generateQRCodeURL(shareUrl: string): string {
    // Using Google Charts API for QR code generation
    const size = 300;
    const encoded = encodeURIComponent(shareUrl);
    return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}`;
}

/**
 * Shorten URL (mock - in production use real URL shortener)
 */
export function shortenURL(longUrl: string): string {
    // This is a mock implementation
    // In production, integrate with bit.ly, TinyURL, or custom shortener
    const hash = btoa(longUrl).slice(0, 8);
    return `https://govtrip.go.th/s/${hash}`;
}

/**
 * Get share link statistics
 */
export interface ShareLinkStats {
    totalLinks: number;
    activeLinks: number;
    expiredLinks: number;
    totalAccess: number;
    mostAccessedTrip?: string;
}

export function getShareLinkStats(links: ShareLink[]): ShareLinkStats {
    const now = new Date();
    const active = links.filter(l => l.isActive && l.expiresAt > now);
    const expired = links.filter(l => l.expiresAt <= now);
    const totalAccess = links.reduce((sum, l) => sum + l.accessCount, 0);

    // Find most accessed
    const sorted = [...links].sort((a, b) => b.accessCount - a.accessCount);
    const mostAccessedTrip = sorted.length > 0 ? sorted[0].tripId : undefined;

    return {
        totalLinks: links.length,
        activeLinks: active.length,
        expiredLinks: expired.length,
        totalAccess,
        mostAccessedTrip,
    };
}

/**
 * Revoke share link
 */
export function revokeShareLink(shareLink: ShareLink): ShareLink {
    return {
        ...shareLink,
        isActive: false,
    };
}

/**
 * Extend share link expiration
 */
export function extendShareLink(shareLink: ShareLink, additionalSeconds: number): ShareLink {
    const newExpiresAt = new Date(shareLink.expiresAt.getTime() + additionalSeconds * 1000);

    return {
        ...shareLink,
        expiresAt: newExpiresAt,
    };
}
