/**
 * Trip Template Module
 * ภารกิจซ้ำ ๆ กดสร้างทริปได้ทันที
 */

import type { Trip } from '../utils/zod';
import { generateTripId } from '../utils/id';

export interface TripTemplate {
    id: string;
    name: string;
    description?: string;
    category: 'ROUTINE' | 'INSPECTION' | 'MEETING' | 'EMERGENCY' | 'OTHER';

    // Template data
    defaultTitle: string;
    startLocation: string;
    startCoords: { lat: number; lng: number };
    endLocation: string;
    endCoords: { lat: number; lng: number };

    // Optional defaults
    defaultVehicle?: string;
    estimatedDistance?: number;
    estimatedDuration?: number; // hours

    // Cost estimates
    estimatedFuelCost?: number;
    defaultAllowance?: number;
    defaultAccommodation?: number;

    // Schedule
    isRecurring: boolean;
    recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    recurringDay?: number; // Day of week (0-6) or day of month (1-31)

    // Usage
    usageCount: number;
    lastUsed?: Date;
    createdBy: string;
    createdAt: Date;

    // Sharing
    isPublic: boolean; // ใช้ร่วมกันทั้งหน่วยงาน
    department?: string;
}

/**
 * Create trip from template
 */
export function createTripFromTemplate(
    template: TripTemplate,
    overrides?: Partial<Trip>
): Omit<Trip, 'id'> & { id?: string } {
    const now = new Date();

    return {
        id: generateTripId(),
        title: overrides?.title || template.defaultTitle,
        date: overrides?.date || now.toISOString().split('T')[0],
        vehicle: overrides?.vehicle || template.defaultVehicle,

        startLocation: overrides?.startLocation || template.startLocation,
        startCoords: overrides?.startCoords || template.startCoords,

        endLocation: overrides?.endLocation || template.endLocation,
        endCoords: overrides?.endCoords || template.endCoords,

        distance: overrides?.distance || template.estimatedDistance || 0,

        fuelPrice: overrides?.fuelPrice,
        fuelCost: overrides?.fuelCost || template.estimatedFuelCost,
        allowance: overrides?.allowance || template.defaultAllowance,
        accommodation: overrides?.accommodation || template.defaultAccommodation,

        totalCost: overrides?.totalCost ||
            (template.estimatedFuelCost || 0) +
            (template.defaultAllowance || 0) +
            (template.defaultAccommodation || 0),

        status: overrides?.status || 'รออนุมัติ',
        risk: overrides?.risk,
    };
}

/**
 * Get popular templates (most used)
 */
export function getPopularTemplates(
    templates: TripTemplate[],
    limit: number = 5
): TripTemplate[] {
    return [...templates]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
}

/**
 * Get recent templates (recently used)
 */
export function getRecentTemplates(
    templates: TripTemplate[],
    limit: number = 5
): TripTemplate[] {
    return [...templates]
        .filter(t => t.lastUsed)
        .sort((a, b) => {
            const aTime = a.lastUsed?.getTime() || 0;
            const bTime = b.lastUsed?.getTime() || 0;
            return bTime - aTime;
        })
        .slice(0, limit);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
    templates: TripTemplate[],
    category: TripTemplate['category']
): Triptemplate[] {
    return templates.filter(t => t.category === category);
}

/**
 * Update template usage
 */
export function updateTemplateUsage(template: TripTemplate): TripTemplate {
    return {
        ...template,
        usageCount: template.usageCount + 1,
        lastUsed: new Date(),
    };
}

/**
 * Get next scheduled date for recurring template
 */
export function getNextScheduledDate(template: TripTemplate, fromDate: Date = new Date()): Date | null {
    if (!template.isRecurring || !template.recurringPattern) {
        return null;
    }

    const next = new Date(fromDate);

    switch (template.recurringPattern) {
        case 'DAILY':
            next.setDate(next.getDate() + 1);
            break;

        case 'WEEKLY':
            if (template.recurringDay !== undefined) {
                // Find next occurrence of day of week
                const currentDay = next.getDay();
                const targetDay = template.recurringDay;
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                next.setDate(next.getDate() + daysToAdd);
            }
            break;

        case 'MONTHLY':
            if (template.recurringDay !== undefined) {
                // Next month, same day
                next.setMonth(next.getMonth() + 1);
                next.setDate(Math.min(template.recurringDay, 31));
            }
            break;

        case 'QUARTERLY':
            next.setMonth(next.getMonth() + 3);
            if (template.recurringDay !== undefined) {
                next.setDate(Math.min(template.recurringDay, 31));
            }
            break;
    }

    return next;
}

/**
 * Create template from trip
 */
export function createTemplateFromTrip(
    trip: Trip,
    templateName: string,
    category: TripTemplate['category'],
    userId: string,
    options?: {
        isPublic?: boolean;
        isRecurring?: boolean;
        recurringPattern?: TripTemplate['recurringPattern'];
        department?: string;
    }
): TripTemplate {
    return {
        id: `TMPL-${Date.now()}`,
        name: templateName,
        description: `สร้างจากทริป ${trip.id}`,
        category,

        defaultTitle: trip.title,
        startLocation: trip.startLocation,
        startCoords: trip.startCoords,
        endLocation: trip.endLocation,
        endCoords: trip.endCoords,

        defaultVehicle: trip.vehicle,
        estimatedDistance: trip.distance,

        estimatedFuelCost: trip.fuelCost,
        defaultAllowance: trip.allowance,
        defaultAccommodation: trip.accommodation,

        isRecurring: options?.isRecurring || false,
        recurringPattern: options?.recurringPattern,

        usageCount: 0,
        createdBy: userId,
        createdAt: new Date(),

        isPublic: options?.isPublic || false,
        department: options?.department,
    };
}

/**
 * Quick templates for common routes
 */
export const QUICK_TEMPLATES = {
    BANGKOK_TO_AYUTTHAYA: {
        name: 'กรุงเทพฯ - อยุธยา',
        category: 'ROUTINE' as const,
        startLocation: 'กรุงเทพมหานคร',
        startCoords: { lat: 13.7563, lng: 100.5018 },
        endLocation: 'จังหวัดพระนครศรีอยุธยา',
        endCoords: { lat: 14.3692, lng: 100.5877 },
        estimatedDistance: 85,
        estimatedFuelCost: 850,
        defaultAllowance: 500,
    },

    BANGKOK_TO_CHONBURI: {
        name: 'กรุงเทพฯ - ชลบุรี',
        category: 'ROUTINE' as const,
        startLocation: 'กรุงเทพมหานคร',
        startCoords: { lat: 13.7563, lng: 100.5018 },
        endLocation: 'จังหวัดชลบุรี',
        endCoords: { lat: 13.3611, lng: 100.9847 },
        estimatedDistance: 120,
        estimatedFuelCost: 1200,
        defaultAllowance: 500,
        defaultAccommodation: 1200,
    },

    BANGKOK_TO_CHIANGMAI: {
        name: 'กรุงเทพฯ - เชียงใหม่',
        category: 'INSPECTION' as const,
        startLocation: 'กรุงเทพมหานคร',
        startCoords: { lat: 13.7563, lng: 100.5018 },
        endLocation: 'จังหวัดเชียงใหม่',
        endCoords: { lat: 18.7883, lng: 98.9853 },
        estimatedDistance: 700,
        estimatedFuelCost: 7000,
        defaultAllowance: 1000,
        defaultAccommodation: 2000,
    },
} as const;

/**
 * Template Analytics
 */
export function getTemplateAnalytics(templates: TripTemplate[]): {
    totalTemplates: number;
    totalUsage: number;
    averageUsage: number;
    mostPopular?: TripTemplate;
    byCategory: Record<string, number>;
    publicTemplates: number;
    recurringTemplates: number;
} {
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const mostPopular = [...templates].sort((a, b) => b.usageCount - a.usageCount)[0];

    const byCategory = templates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalTemplates: templates.length,
        totalUsage,
        averageUsage: templates.length > 0 ? totalUsage / templates.length : 0,
        mostPopular,
        byCategory,
        publicTemplates: templates.filter(t => t.isPublic).length,
        recurringTemplates: templates.filter(t => t.isRecurring).length,
    };
}
