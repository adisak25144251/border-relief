import { z } from 'zod';
import type { Trip, GPSPoint } from '../utils/zod';

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return {
            valid: false,
            error: `ไฟล์มีขนาดใหญ่เกินกำหนด (สูงสุด ${maxSizeMB}MB)`,
        };
    }
    return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `ประเภทไฟล์ไม่ถูกต้อง (อนุญาต: ${allowedTypes.join(', ')})`,
        };
    }
    return { valid: true };
}

/**
 * Validate GPS coordinate
 */
export function validateCoordinate(lat: number, lng: number): { valid: boolean; error?: string } {
    if (lat < -90 || lat > 90) {
        return { valid: false, error: 'Latitude ต้องอยู่ระหว่าง -90 ถึง 90' };
    }
    if (lng < -180 || lng > 180) {
        return { valid: false, error: 'Longitude ต้องอยู่ระหว่าง -180 ถึง 180' };
    }
    return { valid: true };
}

/**
 * Validate GPS accuracy
 */
export function validateGPSAccuracy(accuracy: number, minAccuracy: number = 50): { valid: boolean; warning?: string } {
    if (accuracy > minAccuracy) {
        return {
            valid: true,
            warning: `ความแม่นยำของ GPS ต่ำกว่ามาตรฐาน (${accuracy}m > ${minAccuracy}m)`,
        };
    }
    return { valid: true };
}

/**
 * Validate date range
 */
export function validateDateRange(date: Date, maxDaysAgo: number = 365): { valid: boolean; error?: string } {
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysAgo > maxDaysAgo) {
        return {
            valid: false,
            error: `วันที่เก่าเกินกำหนด (${daysAgo} วันที่แล้ว)`,
        };
    }

    if (date > now) {
        return {
            valid: false,
            error: 'ไม่สามารถใช้วันที่ในอนาคตได้',
        };
    }

    return { valid: true };
}

/**
 * Validate distance reasonableness
 */
export function validateDistance(distance: number, coords: { start: { lat: number; lng: number }; end: { lat: number; lng: number } }): {
    valid: boolean;
    warning?: string;
} {
    // Calculate straight-line distance
    const R = 6371; // Earth radius in km
    const dLat = ((coords.end.lat - coords.start.lat) * Math.PI) / 180;
    const dLon = ((coords.end.lng - coords.start.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coords.start.lat * Math.PI) / 180) *
        Math.cos((coords.end.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLine = R * c;

    // Road distance should be 1.2-2x straight line
    const minExpected = straightLine * 1.2;
    const maxExpected = straightLine * 2.5;

    if (distance < minExpected) {
        return {
            valid: true,
            warning: `ระยะทางต่ำกว่าที่คาดการณ์ (${distance.toFixed(2)} km < ${minExpected.toFixed(2)} km)`,
        };
    }

    if (distance > maxExpected) {
        return {
            valid: true,
            warning: `ระยะทางสูงกว่าที่คาดการณ์ (${distance.toFixed(2)} km > ${maxExpected.toFixed(2)} km)`,
        };
    }

    return { valid: true };
}

/**
 * Validate trip data completeness
 */
export function validateTripCompleteness(trip: Partial<Trip>): {
    complete: boolean;
    missingFields: string[];
    warnings: string[];
} {
    const required = ['title', 'startLocation', 'endLocation', 'startCoords', 'endCoords', 'distance'];
    const missingFields: string[] = [];
    const warnings: string[] = [];

    required.forEach((field) => {
        if (!(trip as any)[field]) {
            missingFields.push(field);
        }
    });

    // Check optional but recommended fields
    if (!trip.vehicle) warnings.push('ไม่ได้ระบุพาหนะ');
    if (!trip.fuelPrice) warnings.push('ไม่ได้ระบุราคาน้ำมัน');
    if (trip.distance && trip.distance === 0) warnings.push('ระยะทางเป็น 0');

    return {
        complete: missingFields.length === 0,
        missingFields,
        warnings,
    };
}

/**
 * Batch validation for multiple trips
 */
export interface ValidationResult {
    valid: number;
    invalid: number;
    warnings: number;
    errors: Array<{ index: number; trip: any; errors: string[]; warnings: string[] }>;
}

export function validateTripBatch(trips: any[]): ValidationResult {
    let valid = 0;
    let invalid = 0;
    let warningCount = 0;
    const errors: ValidationResult['errors'] = [];

    trips.forEach((trip, index) => {
        const tripErrors: string[] = [];
        const tripWarnings: string[] = [];

        try {
            // Validate completeness
            const completeness = validateTripCompleteness(trip);
            if (!completeness.complete) {
                tripErrors.push(`Missing fields: ${completeness.missingFields.join(', ')}`);
            }
            tripWarnings.push(...completeness.warnings);

            // Validate coordinates
            if (trip.startCoords) {
                const coordCheck = validateCoordinate(trip.startCoords.lat, trip.startCoords.lng);
                if (!coordCheck.valid) tripErrors.push(`Start: ${coordCheck.error}`);
            }
            if (trip.endCoords) {
                const coordCheck = validateCoordinate(trip.endCoords.lat, trip.endCoords.lng);
                if (!coordCheck.valid) tripErrors.push(`End: ${coordCheck.error}`);
            }

            // Validate distance
            if (trip.distance && trip.startCoords && trip.endCoords) {
                const distCheck = validateDistance(trip.distance, {
                    start: trip.startCoords,
                    end: trip.endCoords,
                });
                if (distCheck.warning) tripWarnings.push(distCheck.warning);
            }

            if (tripErrors.length > 0) {
                invalid++;
                errors.push({ index, trip, errors: tripErrors, warnings: tripWarnings });
            } else {
                valid++;
                if (tripWarnings.length > 0) {
                    warningCount++;
                    errors.push({ index, trip, errors: [], warnings: tripWarnings });
                }
            }
        } catch (error) {
            invalid++;
            errors.push({ index, trip, errors: [`Validation error: ${error}`], warnings: [] });
        }
    });

    return { valid, invalid, warnings: warningCount, errors };
}
