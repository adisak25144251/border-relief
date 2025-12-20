/**
 * Advanced PII Guard Module
 * โหมดซ่อนชื่อ/พิกัดละเอียด, เบลอจุดบ้าน/ที่พัก (radius blur)
 */

import { maskName, maskEmail, maskPhoneNumber, maskGPSCoordinate } from '../privacy/piiMask';

export interface PIIGuardConfig {
    mode: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'OFF';
    blurRadius: number; // meters
    homeLocations: Array<{ lat: number; lng: number; radius: number }>; // ที่พักอาศัย
    sensitiveZones: Array<{
        name: string;
        center: { lat: number; lng: number };
        radius: number;
        blurLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
}

export interface PIIGuardedData {
    original: any;
    masked: any;
    fieldsmasked: string[];
    blurredLocations: number;
    guardLevel: string;
}

/**
 * Apply PII protection to trip data
 */
export function applyPIIGuard(
    data: any,
    config: PIIGuardConfig,
    userRole: 'admin' | 'manager' | 'driver' | 'auditor' | 'public'
): PIIGuardedData {
    const masked = JSON.parse(JSON.stringify(data)); // Deep clone
    const fieldsMasked: string[] = [];
    let blurredLocations = 0;

    // Role-based access
    const guardLevel = getGuardLevelForRole(userRole, config.mode);

    if (guardLevel === 'OFF') {
        return {
            original: data,
            masked: data,
            fieldsMasked: [],
            blurredLocations: 0,
            guardLevel: 'OFF',
        };
    }

    // Mask names
    if (masked.driverName) {
        masked.driverName = maskName(masked.driverName);
        fieldsMasked.push('driverName');
    }

    if (masked.approvedBy && guardLevel !== 'MINIMAL') {
        masked.approvedBy = maskName(masked.approvedBy);
        fieldsMasked.push('approvedBy');
    }

    // Mask contact info
    if (masked.driverEmail && guardLevel !== 'MINIMAL') {
        masked.driverEmail = maskEmail(masked.driverEmail);
        fieldsMasked.push('driverEmail');
    }

    if (masked.driverPhone && guardLevel !== 'MINIMAL') {
        masked.driverPhone = maskPhoneNumber(masked.driverPhone);
        fieldsMasked.push('driverPhone');
    }

    // Blur GPS coordinates
    if (masked.startCoords) {
        const blurred = blurSensitiveLocation(
            masked.startCoords,
            config.homeLocations,
            config.sensitiveZones,
            config.blurRadius,
            guardLevel
        );
        if (blurred.wasBlurred) {
            masked.startCoords = blurred.coords;
            blurredLocations++;
            fieldsMasked.push('startCoords');
        }
    }

    if (masked.endCoords) {
        const blurred = blurSensitiveLocation(
            masked.endCoords,
            config.homeLocations,
            config.sensitiveZones,
            config.blurRadius,
            guardLevel
        );
        if (blurred.wasBlurred) {
            masked.endCoords = blurred.coords;
            blurredLocations++;
            fieldsMasked.push('endCoords');
        }
    }

    // Blur GPS track
    if (masked.gpsPoints && Array.isArray(masked.gpsPoints)) {
        masked.gpsPoints = masked.gpsPoints.map((point: any) => {
            const blurred = blurSensitiveLocation(
                { lat: point.lat, lng: point.lng },
                config.homeLocations,
                config.sensitiveZones,
                config.blurRadius,
                guardLevel
            );

            if (blurred.wasBlurred) {
                blurredLocations++;
                return { ...point, ...blurred.coords, _blurred: true };
            }
            return point;
        });

        if (blurredLocations > 0) {
            fieldsMasked.push('gpsPoints');
        }
    }

    // Mask location names if needed
    if (guardLevel === 'FULL') {
        if (masked.startLocation) {
            masked.startLocation = maskLocationDetails(masked.startLocation);
            fieldsMasked.push('startLocation');
        }
        if (masked.endLocation) {
            masked.endLocation = maskLocationDetails(masked.endLocation);
            fieldsMasked.push('endLocation');
        }
    }

    return {
        original: data,
        masked,
        fieldsMasked,
        blurredLocations,
        guardLevel,
    };
}

/**
 * Get guard level based on user role
 */
function getGuardLevelForRole(
    role: 'admin' | 'manager' | 'driver' | 'auditor' | 'public',
    configMode: PIIGuardConfig['mode']
): string {
    if (configMode === 'OFF') return 'OFF';

    switch (role) {
        case 'admin':
        case 'auditor':
            return 'MINIMAL'; // See most data

        case 'manager':
            return configMode === 'FULL' ? 'PARTIAL' : 'MINIMAL';

        case 'driver':
            return 'MINIMAL'; // Can see own data

        case 'public':
            return 'FULL'; // Maximum protection

        default:
            return 'FULL';
    }
}

/**
 * Blur location if it's near sensitive zones
 */
function blurSensitiveLocation(
    coords: { lat: number; lng: number },
    homeLocations: Array<{ lat: number; lng: number; radius: number }>,
    sensitiveZones: PIIGuardConfig['sensitiveZones'],
    defaultBlurRadius: number,
    guardLevel: string
): {
    coords: { lat: number; lng: number };
    wasBlurred: boolean;
    reason?: string;
} {
    // Check home locations
    for (const home of homeLocations) {
        const distance = calculateDistance(coords, home);
        if (distance < home.radius) {
            return {
                coords: blurCoordinates(coords, home.radius / 2), // Blur to half radius
                wasBlurred: true,
                reason: 'Near home location',
            };
        }
    }

    // Check sensitive zones
    for (const zone of sensitiveZones) {
        const distance = calculateDistance(coords, zone.center);
        if (distance < zone.radius) {
            const blurAmount =
                zone.blurLevel === 'HIGH' ? zone.radius * 0.5 :
                    zone.blurLevel === 'MEDIUM' ? zone.radius * 0.3 :
                        zone.radius * 0.1;

            return {
                coords: blurCoordinates(coords, blurAmount),
                wasBlurred: true,
                reason: `Near sensitive zone: ${zone.name}`,
            };
        }
    }

    // General blur based on guard level
    if (guardLevel === 'FULL') {
        return {
            coords: blurCoordinates(coords, defaultBlurRadius),
            wasBlurred: true,
            reason: 'Full PII guard mode',
        };
    }

    return {
        coords,
        wasBlurred: false,
    };
}

/**
 * Blur coordinates by adding random offset
 */
function blurCoordinates(
    coords: { lat: number; lng: number },
    radiusMeters: number
): { lat: number; lng: number } {
    // Convert meters to degrees (approximate)
    const latOffset = (radiusMeters / 111320) * (Math.random() - 0.5) * 2;
    const lngOffset = (radiusMeters / (111320 * Math.cos((coords.lat * Math.PI) / 180))) * (Math.random() - 0.5) * 2;

    return {
        lat: parseFloat((coords.lat + latOffset).toFixed(4)), // 4 decimals ~ 11m precision
        lng: parseFloat((coords.lng + lngOffset).toFixed(4)),
    };
}

/**
 * Calculate distance between two points
 */
function calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
): number {
    const R = 6371000; // meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Mask location name details
 */
function maskLocationDetails(location: string): string {
    // Remove house number, soi, etc.
    // Keep only district and province

    const parts = location.split(',').map(p => p.trim());

    // Try to extract district and province
    const district = parts.find(p => p.includes('เขต') || p.includes('อำเภอ')) || '';
    const province = parts.find(p =>
        p.includes('กรุงเทพ') ||
        p.includes('จังหวัด') ||
        p.length > 10 // Likely a province name
    ) || '';

    return `${district} ${province}`.trim() || 'พื้นที่ถูกปกปิด';
}

/**
 * Create PII guard config for organization
 */
export function createOrganizationPIIConfig(
    organizationName: string,
    officeLocations: Array<{ lat: number; lng: number }>,
    options?: {
        mode?: PIIGuardConfig['mode'];
        blurRadius?: number;
    }
): PIIGuardConfig {
    return {
        mode: options?.mode || 'PARTIAL',
        blurRadius: options?.blurRadius || 100, // 100 meters default
        homeLocations: [], // To be configured per user
        sensitiveZones: officeLocations.map((loc, i) => ({
            name: `${organizationName} สำนักงาน ${i + 1}`,
            center: loc,
            radius: 300, // 300m around office
            blurLevel: 'MEDIUM' as const,
        })),
    };
}

/**
 * Validate PII guard effectiveness
 */
export function validatePIIGuard(
    original: any,
    masked: any
): {
    effective: boolean;
    issues: string[];
    score: number; // 0-100
} {
    const issues: string[] = [];
    let score = 100;

    // Check if names are still visible
    if (original.driverName && masked.driverName === original.driverName) {
        issues.push('Driver name not masked');
        score -= 20;
    }

    // Check if exact coordinates are still visible
    if (
        original.startCoords &&
        masked.startCoords &&
        original.startCoords.lat === masked.startCoords.lat &&
        original.startCoords.lng === masked.startCoords.lng
    ) {
        score -= 15; // Not critical, but should be blurred
    }

    // Check contact info
    if (original.driverEmail && masked.driverEmail === original.driverEmail) {
        issues.push('Email not masked');
        score -= 15;
    }

    if (original.driverPhone && masked.driverPhone === original.driverPhone) {
        issues.push('Phone not masked');
        score -= 15;
    }

    return {
        effective: issues.length === 0 && score >= 70,
        issues,
        score: Math.max(0, score),
    };
}
