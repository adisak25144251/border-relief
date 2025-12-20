/**
 * Fleet Management Module
 * ระบบจัดการยานพาหนะ ซ่อมบำรุง ค่าเสื่อม ประกัน ภาษี
 */

import type { Vehicle } from '../utils/zod';

export interface FleetVehicle extends Vehicle {
    // Maintenance
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    maintenanceMileage?: number; // km between maintenance
    currentMileage: number;

    // Insurance
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceExpiryDate?: Date;
    insurancePremium?: number;

    // Tax
    taxExpiryDate?: Date;
    annualTax?: number;

    // Depreciation
    purchaseDate: Date;
    purchasePrice: number;
    currentValue?: number;
    depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'MILEAGE_BASED';
    usefulLifeYears?: number;

    // Status
    operationalStatus: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'RESERVED';
    assignedTo?: string; // User ID
}

export interface MaintenanceRecord {
    id: string;
    vehicleId: string;
    date: Date;
    type: 'SCHEDULED' | 'UNSCHEDULED' | 'EMERGENCY';
    category: 'OIL_CHANGE' | 'TIRE' | 'BRAKE' | 'ENGINE' | 'ELECTRICAL' | 'BODY' | 'OTHER';
    description: string;
    cost: number;
    mileage: number;
    vendor?: string;
    nextServiceDue?: Date;
    nextServiceMileage?: number;
}

/**
 * Calculate vehicle depreciation
 */
export function calculateDepreciation(vehicle: FleetVehicle, asOfDate: Date = new Date()): {
    originalValue: number;
    currentValue: number;
    totalDepreciation: number;
    annualDepreciation: number;
    monthlyDepreciation: number;
    method: string;
} {
    const ageInYears =
        (asOfDate.getTime() - vehicle.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    let currentValue = vehicle.purchasePrice;
    let annualDepreciation = 0;

    switch (vehicle.depreciationMethod) {
        case 'STRAIGHT_LINE':
            const usefulLife = vehicle.usefulLifeYears || 10;
            annualDepreciation = vehicle.purchasePrice / usefulLife;
            currentValue = Math.max(0, vehicle.purchasePrice - annualDepreciation * ageInYears);
            break;

        case 'DECLINING_BALANCE':
            // 20% declining balance per year (common for vehicles)
            const rate = 0.20;
            currentValue = vehicle.purchasePrice * Math.pow(1 - rate, ageInYears);
            annualDepreciation = vehicle.purchasePrice * rate; // First year
            break;

        case 'MILEAGE_BASED':
            // Depreciate based on mileage (e.g., 1 baht per km)
            const depPerKm = vehicle.purchasePrice / 300000; // Assume 300k km lifetime
            currentValue = Math.max(0, vehicle.purchasePrice - vehicle.currentMileage * depPerKm);
            annualDepreciation = depPerKm * 15000; // Assume 15k km/year
            break;
    }

    const totalDepreciation = vehicle.purchasePrice - currentValue;
    const monthlyDepreciation = annualDepreciation / 12;

    return {
        originalValue: vehicle.purchasePrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalDepreciation: parseFloat(totalDepreciation.toFixed(2)),
        annualDepreciation: parseFloat(annualDepreciation.toFixed(2)),
        monthlyDepreciation: parseFloat(monthlyDepreciation.toFixed(2)),
        method: vehicle.depreciationMethod,
    };
}

/**
 * Check maintenance due
 */
export function checkMaintenanceDue(vehicle: FleetVehicle): {
    isDue: boolean;
    daysUntilDue?: number;
    kmUntilDue?: number;
    priority: 'URGENT' | 'SOON' | 'OK';
    reasons: string[];
} {
    const now = new Date();
    const reasons: string[] = [];
    let isDue = false;
    let priority: 'URGENT' | 'SOON' | 'OK' = 'OK';
    let daysUntilDue: number | undefined;
    let kmUntilDue: number | undefined;

    // Check by date
    if (vehicle.nextMaintenanceDate) {
        const daysRemaining = Math.floor(
            (vehicle.nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysUntilDue = daysRemaining;

        if (daysRemaining < 0) {
            isDue = true;
            priority = 'URGENT';
            reasons.push(`เลยกำหนดบำรุงรักษา ${Math.abs(daysRemaining)} วัน`);
        } else if (daysRemaining <= 7) {
            isDue = true;
            priority = 'URGENT';
            reasons.push(`ใกล้กำหนดบำรุงรักษา (${daysRemaining} วัน)`);
        } else if (daysRemaining <= 30) {
            priority = 'SOON';
            reasons.push(`กำหนดบำรุงรักษาในอีก ${daysRemaining} วัน`);
        }
    }

    // Check by mileage
    if (vehicle.maintenanceMileage && vehicle.lastMaintenanceDate) {
        // Estimate km since last maintenance (simplified)
        const daysSinceMaintenance = Math.floor(
            (now.getTime() - vehicle.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const estimatedKm = daysSinceMaintenance * 50; // Assume 50 km/day average
        const kmRemaining = vehicle.maintenanceMileage - estimatedKm;
        kmUntilDue = kmRemaining;

        if (kmRemaining < 0) {
            isDue = true;
            priority = 'URGENT';
            reasons.push(`เกินระยะทางบำรุงรักษา ${Math.abs(kmRemaining)} กม.`);
        } else if (kmRemaining <= 1000) {
            isDue = true;
            priority = 'URGENT';
            reasons.push(`ใกล้ถึงระยะทางบำรุงรักษา (${kmRemaining} กม.)`);
        }
    }

    return {
        isDue,
        daysUntilDue,
        kmUntilDue,
        priority,
        reasons,
    };
}

/**
 * Check insurance/tax expiry
 */
export function checkExpirations(vehicle: FleetVehicle): {
    insuranceExpired: boolean;
    insuranceDaysRemaining?: number;
    taxExpired: boolean;
    taxDaysRemaining?: number;
    alerts: string[];
} {
    const now = new Date();
    const alerts: string[] = [];
    let insuranceExpired = false;
    let taxExpired = false;
    let insuranceDaysRemaining: number | undefined;
    let taxDaysRemaining: number | undefined;

    // Insurance
    if (vehicle.insuranceExpiryDate) {
        const days = Math.floor(
            (vehicle.insuranceExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        insuranceDaysRemaining = days;

        if (days < 0) {
            insuranceExpired = true;
            alerts.push(`🚨 ประกันหมดอายุแล้ว ${Math.abs(days)} วัน`);
        } else if (days <= 30) {
            alerts.push(`⚠️ ประกันใกล้หมดอายุ (${days} วัน)`);
        } else if (days <= 60) {
            alerts.push(`ℹ️ ประกันหมดอายุในอีก ${days} วัน`);
        }
    }

    // Tax
    if (vehicle.taxExpiryDate) {
        const days = Math.floor(
            (vehicle.taxExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        taxDaysRemaining = days;

        if (days < 0) {
            taxExpired = true;
            alerts.push(`🚨 ภาษีหมดอายุแล้ว ${Math.abs(days)} วัน`);
        } else if (days <= 30) {
            alerts.push(`⚠️ ภาษีใกล้หมดอายุ (${days} วัน)`);
        } else if (days <= 60) {
            alerts.push(`ℹ️ ภาษีหมดอายุในอีก ${days} วัน`);
        }
    }

    return {
        insuranceExpired,
        insuranceDaysRemaining,
        taxExpired,
        taxDaysRemaining,
        alerts,
    };
}

/**
 * Calculate total cost of ownership (TCO)
 */
export function calculateTCO(
    vehicle: FleetVehicle,
    maintenanceRecords: MaintenanceRecord[],
    fuelCostPerYear: number
): {
    purchasePrice: number;
    depreciation: number;
    maintenance: number;
    fuel: number;
    insurance: number;
    tax: number;
    total: number;
    perYear: number;
    perMonth: number;
    perKm: number;
} {
    const ageYears =
        (new Date().getTime() - vehicle.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const depreciation = calculateDepreciation(vehicle).totalDepreciation;
    const maintenance = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
    const insurance = (vehicle.insurancePremium || 0) * ageYears;
    const tax = (vehicle.annualTax || 0) * ageYears;
    const fuel = fuelCostPerYear * ageYears;

    const total = vehicle.purchasePrice + maintenance + fuel + insurance + tax;
    const perYear = total / Math.max(ageYears, 1);
    const perMonth = perYear / 12;
    const perKm = vehicle.currentMileage > 0 ? total / vehicle.currentMileage : 0;

    return {
        purchasePrice: vehicle.purchasePrice,
        depreciation,
        maintenance,
        fuel,
        insurance,
        tax,
        total: parseFloat(total.toFixed(2)),
        perYear: parseFloat(perYear.toFixed(2)),
        perMonth: parseFloat(perMonth.toFixed(2)),
        perKm: parseFloat(perKm.toFixed(2)),
    };
}

/**
 * Fleet analytics
 */
export function getFleetAnalytics(vehicles: FleetVehicle[]): {
    totalVehicles: number;
    activeVehicles: number;
    averageAge: number;
    totalValue: number;
    averageMileage: number;
    maintenanceDue: number;
    expiredInsurance: number;
    expiredTax: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
} {
    const now = new Date();
    let maintenanceDue = 0;
    let expiredInsurance = 0;
    let expiredTax = 0;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    vehicles.forEach(v => {
        // Maintenance
        if (checkMaintenanceDue(v).isDue) maintenanceDue++;

        // Insurance / Tax
        const exp = checkExpirations(v);
        if (exp.insuranceExpired) expiredInsurance++;
        if (exp.taxExpired) expiredTax++;

        // Type & Status
        byType[v.type] = (byType[v.type] || 0) + 1;
        byStatus[v.operationalStatus] = (byStatus[v.operationalStatus] || 0) + 1;
    });

    const totalAge = vehicles.reduce((sum, v) => {
        const age =
            (now.getTime() - v.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return sum + age;
    }, 0);

    const totalValue = vehicles.reduce((sum, v) => {
        return sum + calculateDepreciation(v).currentValue;
    }, 0);

    const totalMileage = vehicles.reduce((sum, v) => sum + v.currentMileage, 0);

    return {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.operationalStatus === 'ACTIVE').length,
        averageAge: vehicles.length > 0 ? totalAge / vehicles.length : 0,
        totalValue,
        averageMileage: vehicles.length > 0 ? totalMileage / vehicles.length : 0,
        maintenanceDue,
        expiredInsurance,
        expiredTax,
        byType,
        byStatus,
    };
}
