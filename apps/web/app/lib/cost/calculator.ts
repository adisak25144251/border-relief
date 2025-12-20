import type { Trip, Vehicle } from '../utils/zod';

interface CostBreakdown {
    fuelCost: number;
    allowance: number;
    accommodation: number;
    depreciation: number;
    wearAndTear: number;
    total: number;
}

/**
 * Calculate comprehensive trip cost
 */
export function calculateTripCost(
    trip: Trip,
    vehicle?: Vehicle,
    options?: {
        includeDepreciation?: boolean;
        includeWearAndTear?: boolean;
        depreciationRate?: number; // cost per km
        maintenanceRate?: number; // cost per km
    }
): CostBreakdown {
    const {
        includeDepreciation = true,
        includeWearAndTear = true,
        depreciationRate = 2.5, // ฿2.5/km default
        maintenanceRate = 1.5, // ฿1.5/km default
    } = options || {};

    // Fuel cost
    const fuelEfficiency = vehicle?.fuelEfficiency || 10; // km/liter default
    const fuelConsumption = trip.distance / fuelEfficiency;
    const fuelPrice = trip.fuelPrice || 35.5;
    const fuelCost = fuelConsumption * fuelPrice;

    // Other costs
    const allowance = trip.allowance || 0;
    const accommodation = trip.accommodation || 0;

    // Depreciation
    const depreciation = includeDepreciation ? trip.distance * depreciationRate : 0;

    // Wear and tear
    const wearAndTear = includeWearAndTear ? trip.distance * maintenanceRate : 0;

    const total = fuelCost + allowance + accommodation + depreciation + wearAndTear;

    return {
        fuelCost: parseFloat(fuelCost.toFixed(2)),
        allowance,
        accommodation,
        depreciation: parseFloat(depreciation.toFixed(2)),
        wearAndTear: parseFloat(wearAndTear.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
    };
}

/**
 * Calculate cost per kilometer
 */
export function calculateCostPerKm(totalCost: number, distance: number): number {
    if (distance === 0) return 0;
    return parseFloat((totalCost / distance).toFixed(2));
}

/**
 * Estimate monthly costs based on average trips
 */
export function estimateMonthlyCosts(
    averageTripsPerMonth: number,
    averageDistancePerTrip: number,
    vehicle?: Vehicle,
    fuelPrice: number = 35.5
): {
    totalDistance: number;
    fuelCost: number;
    depreciation: number;
    maintenance: number;
    estimatedTotal: number;
} {
    const totalDistance = averageTripsPerMonth * averageDistancePerTrip;
    const fuelEfficiency = vehicle?.fuelEfficiency || 10;
    const fuelConsumption = totalDistance / fuelEfficiency;
    const fuelCost = fuelConsumption * fuelPrice;

    const depreciation = totalDistance * 2.5; // ฿2.5/km
    const maintenance = totalDistance * 1.5; // ฿1.5/km

    return {
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        fuelCost: parseFloat(fuelCost.toFixed(2)),
        depreciation: parseFloat(depreciation.toFixed(2)),
        maintenance: parseFloat(maintenance.toFixed(2)),
        estimatedTotal: parseFloat((fuelCost + depreciation + maintenance).toFixed(2)),
    };
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(spent: number, budget: number): {
    percentage: number;
    remaining: number;
    status: 'safe' | 'warning' | 'critical';
} {
    const percentage = (spent / budget) * 100;
    const remaining = budget - spent;

    let status: 'safe' | 'warning' | 'critical' = 'safe';
    if (percentage >= 90) status = 'critical';
    else if (percentage >= 75) status = 'warning';

    return {
        percentage: parseFloat(percentage.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        status,
    };
}

/**
 * Calculate cost savings from route optimization
 */
export function calculateSavings(
    originalDistance: number,
    optimizedDistance: number,
    vehicle?: Vehicle,
    fuelPrice: number = 35.5
): {
    distanceSaved: number;
    fuelSaved: number;
    costSaved: number;
    percentageSaved: number;
} {
    const distanceSaved = originalDistance - optimizedDistance;
    const fuelEfficiency = vehicle?.fuelEfficiency || 10;
    const fuelSaved = distanceSaved / fuelEfficiency;
    const costSaved = fuelSaved * fuelPrice;
    const percentageSaved = (distanceSaved / originalDistance) * 100;

    return {
        distanceSaved: parseFloat(distanceSaved.toFixed(2)),
        fuelSaved: parseFloat(fuelSaved.toFixed(2)),
        costSaved: parseFloat(costSaved.toFixed(2)),
        percentageSaved: parseFloat(percentageSaved.toFixed(2)),
    };
}
