/**
 * Policy Engine Module
 * ระบบกำหนดกติกาค่าใช้จ่าย (เพดาน/ประเภทภารกิจ)
 */

import type { Trip } from '../utils/zod';

export interface TripPolicy {
    id: string;
    name: string;
    description: string;
    active: boolean;
    priority: number; // Higher = more important

    // Conditions
    conditions: {
        missionTypes?: string[]; // ประเภทภารกิจ
        departments?: string[];
        userRoles?: Array<'admin' | 'manager' | 'driver'>;
        distanceMin?: number;
        distanceMax?: number;
        destinations?: string[]; // จุดหมายที่อนุญาต
    };

    // Limits
    limits: {
        maxFuelCost?: number;
        maxAllowance?: number;
        maxAccommodation?: number;
        maxTotalCost?: number;
        maxDistancePerDay?: number;
        requiresApproval?: boolean;
        approvalLevel?: 'manager' | 'director' | 'permanent_secretary';
    };

    // Rules
    rules: {
        allowWeekend?: boolean;
        allowHoliday?: boolean;
        requireAdvanceBooking?: boolean; // จองล่วงหน้า
        advanceBookingDays?: number;
        requiresJustification?: boolean; // ต้องแนบเหตุผล
        maxTripDuration?: number; // days
    };
}

export interface PolicyViolation {
    policyId: string;
    policyName: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    field: string;
    message: string;
    currentValue: any;
    allowedValue?: any;
    canOverride: boolean;
}

/**
 * Check if trip complies with policies
 */
export function validateTripAgainstPolicies(
    trip: Trip,
    policies: TripPolicy[],
    userRole: string,
    department?: string
): {
    valid: boolean;
    violations: PolicyViolation[];
    applicablePolicies: TripPolicy[];
    requiresApproval: boolean;
    approvalLevel?: string;
} {
    const violations: PolicyViolation[] = [];
    const applicablePolicies: TripPolicy[] = [];
    let requiresApproval = false;
    let approvalLevel: string | undefined;

    // Sort by priority
    const sortedPolicies = [...policies]
        .filter(p => p.active)
        .sort((a, b) => b.priority - a.priority);

    sortedPolicies.forEach(policy => {
        // Check if policy applies
        if (!isPolicyApplicable(trip, policy, userRole, department)) {
            return;
        }

        applicablePolicies.push(policy);

        // Check limits
        if (policy.limits.maxFuelCost && trip.fuelCost && trip.fuelCost > policy.limits.maxFuelCost) {
            violations.push({
                policyId: policy.id,
                policyName: policy.name,
                severity: 'ERROR',
                field: 'fuelCost',
                message: `ค่าน้ำมันเกินกำหนด (${trip.fuelCost} > ${policy.limits.maxFuelCost})`,
                currentValue: trip.fuelCost,
                allowedValue: policy.limits.maxFuelCost,
                canOverride: false,
            });
        }

        if (policy.limits.maxAllowance && trip.allowance && trip.allowance > policy.limits.maxAllowance) {
            violations.push({
                policyId: policy.id,
                policyName: policy.name,
                severity: 'ERROR',
                field: 'allowance',
                message: `ค่าเบี้ยเลี้ยงเกินกำหนด (${trip.allowance} > ${policy.limits.maxAllowance})`,
                currentValue: trip.allowance,
                allowedValue: policy.limits.maxAllowance,
                canOverride: false,
            });
        }

        if (policy.limits.maxAccommodation && trip.accommodation && trip.accommodation > policy.limits.maxAccommodation) {
            violations.push({
                policyId: policy.id,
                policyName: policy.name,
                severity: 'WARNING',
                field: 'accommodation',
                message: `ค่าที่พักเกินกำหนด (${trip.accommodation} > ${policy.limits.maxAccommodation})`,
                currentValue: trip.accommodation,
                allowedValue: policy.limits.maxAccommodation,
                canOverride: true,
            });
        }

        if (policy.limits.maxTotalCost && trip.totalCost > policy.limits.maxTotalCost) {
            violations.push({
                policyId: policy.id,
                policyName: policy.name,
                severity: 'ERROR',
                field: 'totalCost',
                message: `ต้นทุนรวมเกินกำหนด (${trip.totalCost} > ${policy.limits.maxTotalCost})`,
                currentValue: trip.totalCost,
                allowedValue: policy.limits.maxTotalCost,
                canOverride: false,
            });
        }

        if (policy.limits.maxDistancePerDay && trip.distance > policy.limits.maxDistancePerDay) {
            violations.push({
                policyId: policy.id,
                policyName: policy.name,
                severity: 'WARNING',
                field: 'distance',
                message: `ระยะทางต่อวันเกินกำหนด (${trip.distance} > ${policy.limits.maxDistancePerDay})`,
                currentValue: trip.distance,
                allowedValue: policy.limits.maxDistancePerDay,
                canOverride: true,
            });
        }

        // Check rules
        if (!policy.rules.allowWeekend) {
            const tripDate = new Date(trip.date);
            const day = tripDate.getDay();
            if (day === 0 || day === 6) {
                violations.push({
                    policyId: policy.id,
                    policyName: policy.name,
                    severity: 'WARNING',
                    field: 'date',
                    message: 'ไม่อนุญาตให้เดินทางในวันหยุดสุดสัปดาห์',
                    currentValue: tripDate.toLocaleDateString('th-TH'),
                    canOverride: true,
                });
            }
        }

        // Check approval requirements
        if (policy.limits.requiresApproval) {
            requiresApproval = true;
            approvalLevel = policy.limits.approvalLevel || 'manager';
        }
    });

    return {
        valid: violations.filter(v => v.severity === 'ERROR').length === 0,
        violations,
        applicablePolicies,
        requiresApproval,
        approvalLevel,
    };
}

function isPolicyApplicable(
    trip: Trip,
    policy: TripPolicy,
    userRole: string,
    department?: string
): boolean {
    const cond = policy.conditions;

    // Check user role
    if (cond.userRoles && !cond.userRoles.includes(userRole as any)) {
        return false;
    }

    // Check department
    if (cond.departments && department && !cond.departments.includes(department)) {
        return false;
    }

    // Check distance range
    if (cond.distanceMin && trip.distance < cond.distanceMin) {
        return false;
    }
    if (cond.distanceMax && trip.distance > cond.distanceMax) {
        return false;
    }

    return true;
}

/**
 * Get applicable limit for a field
 */
export function getApplicableLimit(
    field: keyof TripPolicy['limits'],
    policies: TripPolicy[],
    trip: Trip,
    userRole: string,
    department?: string
): number | undefined {
    const applicable = policies
        .filter(p => p.active && isPolicyApplicable(trip, p, userRole, department))
        .sort((a, b) => b.priority - a.priority);

    for (const policy of applicable) {
        const limit = policy.limits[field];
        if (limit !== undefined) {
            return limit as number;
        }
    }

    return undefined;
}

/**
 * Common policy templates
 */
export const POLICY_TEMPLATES = {
    STANDARD_TRIP: {
        id: 'POLICY-001',
        name: 'ทริปมาตรฐาน',
        description: 'นโยบายสำหรับการเดินทางทั่วไป',
        active: true,
        priority: 1,
        conditions: {},
        limits: {
            maxFuelCost: 3000,
            maxAllowance: 500,
            maxAccommodation: 1200,
            maxTotalCost: 5000,
            maxDistancePerDay: 300,
            requiresApproval: true,
            approvalLevel: 'manager' as const,
        },
        rules: {
            allowWeekend: false,
            allowHoliday: false,
            requireAdvanceBooking: true,
            advanceBookingDays: 3,
            requiresJustification: false,
            maxTripDuration: 3,
        },
    },

    EMERGENCY_TRIP: {
        id: 'POLICY-002',
        name: 'ทริปเร่งด่วน',
        description: 'นโยบายสำหรับภารกิจเร่งด่วน',
        active: true,
        priority: 10,
        conditions: {
            missionTypes: ['emergency', 'urgent'],
        },
        limits: {
            maxTotalCost: 10000,
            requiresApproval: true,
            approvalLevel: 'director' as const,
        },
        rules: {
            allowWeekend: true,
            allowHoliday: true,
            requireAdvanceBooking: false,
            requiresJustification: true,
            maxTripDuration: 7,
        },
    },

    LONG_DISTANCE: {
        id: 'POLICY-003',
        name: 'ทริประยะไกล',
        description: 'นโยบายสำหรับเดินทางระยะไกล > 200 กม.',
        active: true,
        priority: 5,
        conditions: {
            distanceMin: 200,
        },
        limits: {
            maxFuelCost: 5000,
            maxAllowance: 1000,
            maxAccommodation: 2000,
            maxTotalCost: 10000,
            requiresApproval: true,
            approvalLevel: 'director' as const,
        },
        rules: {
            allowWeekend: false,
            requireAdvanceBooking: true,
            advanceBookingDays: 7,
            requiresJustification: true,
            maxTripDuration: 5,
        },
    },
} as const;

/**
 * Calculate budget remaining under policy
 */
export function calculatePolicyBudgetRemaining(
    trip: Trip,
    policy: TripPolicy
): {
    fuelRemaining?: number;
    allowanceRemaining?: number;
    accommodationRemaining?: number;
    totalRemaining?: number;
} {
    return {
        fuelRemaining: policy.limits.maxFuelCost
            ? policy.limits.maxFuelCost - (trip.fuelCost || 0)
            : undefined,
        allowanceRemaining: policy.limits.maxAllowance
            ? policy.limits.maxAllowance - (trip.allowance || 0)
            : undefined,
        accommodationRemaining: policy.limits.maxAccommodation
            ? policy.limits.maxAccommodation - (trip.accommodation || 0)
            : undefined,
        totalRemaining: policy.limits.maxTotalCost
            ? policy.limits.maxTotalCost - trip.totalCost
            : undefined,
    };
}
