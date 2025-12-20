import type { Vehicle } from '../utils/zod';

interface FuelCalculation {
    distance: number;
    efficiency: number; // km/liter
    consumption: number; // liters
    price: number; // baht/liter
    totalCost: number;
}

/**
 * Calculate fuel consumption and cost
 */
export function calculateFuelCost(
    distance: number,
    vehicle?: Vehicle,
    fuelPrice: number = 35.5
): FuelCalculation {
    const efficiency = vehicle?.fuelEfficiency || 10; // default 10 km/liter
    const consumption = distance / efficiency;
    const totalCost = consumption * fuelPrice;

    return {
        distance,
        efficiency,
        consumption: parseFloat(consumption.toFixed(2)),
        price: fuelPrice,
        totalCost: parseFloat(totalCost.toFixed(2)),
    };
}

/**
 * Get vehicle fuel efficiency database
 */
export const VEHICLE_EFFICIENCY_DB: Record<string, number> = {
    // Sedans
    'Toyota Camry': 12.5,
    'Honda Accord': 11.8,
    'Honda Civic': 14.2,
    'Toyota Altis': 14.5,

    // SUVs
    'Toyota Fortuner': 10.5,
    'Ford Everest': 9.8,
    'Mitsubishi Pajero': 8.2,
    'Honda CR-V': 11.5,
    'Mazda CX-5': 12.0,

    // Vans
    'Toyota Commuter': 8.5,
    'Hyundai H-1': 9.2,
    'Mercedes Vito': 10.0,

    // Pickups
    'Toyota Hilux Revo': 11.0,
    'Isuzu D-Max': 10.8,
    'Ford Ranger': 10.2,

    // Eco Cars
    'Toyota Prius': 22.0,
    'Honda City': 16.5,
    'Nissan Almera': 17.0,

    // Motorcycles
    'Honda Wave': 50.0,
    'Yamaha Fino': 45.0,
};

/**
 * Estimate fuel efficiency from vehicle type
 */
export function estimateFuelEfficiency(vehicleType: string): number {
    const normalized = vehicleType.toLowerCase();

    if (normalized.includes('motorcycle') || normalized.includes('มอเตอร์ไซค์')) return 45;
    if (normalized.includes('eco') || normalized.includes('hybrid')) return 20;
    if (normalized.includes('van') || normalized.includes('ตู้')) return 8.5;
    if (normalized.includes('suv')) return 10.0;
    if (normalized.includes('pickup') || normalized.includes('กะบะ')) return 10.5;
    if (normalized.includes('sedan') || normalized.includes('เก๋ง')) return 12.5;

    return 10.0; // default
}

/**
 * Calculate fuel price trend (mock - should connect to real API)
 */
export interface FuelPriceTrend {
    date: string;
    price: number;
    change: number;
}

export function getFuelPriceTrend(days: number = 30): FuelPriceTrend[] {
    const basePrice = 35.5;
    const trends: FuelPriceTrend[] = [];

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Simulated price fluctuation
        const fluctuation = (Math.random() - 0.5) * 2;
        const price = basePrice + fluctuation;
        const prevPrice = i < days - 1 ? trends[trends.length - 1].price : basePrice;
        const change = price - prevPrice;

        trends.push({
            date: date.toISOString().split('T')[0],
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
        });
    }

    return trends;
}

/**
 * Calculate annual fuel budget
 */
export function calculateAnnualFuelBudget(
    averageKmPerMonth: number,
    vehicle?: Vehicle,
    fuelPrice: number = 35.5
): {
    monthlyDistance: number;
    annualDistance: number;
    monthlyFuelCost: number;
    annualFuelCost: number;
} {
    const annualDistance = averageKmPerMonth * 12;
    const efficiency = vehicle?.fuelEfficiency || 10;

    const monthlyConsumption = averageKmPerMonth / efficiency;
    const annualConsumption = annualDistance / efficiency;

    const monthlyFuelCost = monthlyConsumption * fuelPrice;
    const annualFuelCost = annualConsumption * fuelPrice;

    return {
        monthlyDistance: averageKmPerMonth,
        annualDistance,
        monthlyFuelCost: parseFloat(monthlyFuelCost.toFixed(2)),
        annualFuelCost: parseFloat(annualFuelCost.toFixed(2)),
    };
}
