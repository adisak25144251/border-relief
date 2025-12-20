import type { Vehicle } from '../utils/zod';

interface CO2Emission {
    distance: number;
    fuelConsumed: number;
    co2Kg: number;
    co2Tons: number;
    treesNeeded: number; // ต้นไม้ที่ต้องการชดเชย
}

// CO2 emission factors (kg CO2 / liter)
const EMISSION_FACTORS = {
    diesel: 2.68,
    gasoline: 2.31,
    e85: 1.85,
    electric: 0.5, // ค่าประมาณจากการผลิตไฟฟ้าในไทย
    hybrid: 1.5,
};

/**
 * Calculate CO2 emissions from trip
 */
export function calculateCO2Emissions(
    distance: number,
    vehicle?: Vehicle,
    fuelType: keyof typeof EMISSION_FACTORS = 'gasoline'
): CO2Emission {
    const efficiency = vehicle?.fuelEfficiency || 10; // km/liter
    const fuelConsumed = distance / efficiency;
    const emissionFactor = EMISSION_FACTORS[fuelType];

    const co2Kg = fuelConsumed * emissionFactor;
    const co2Tons = co2Kg / 1000;

    // ต้นไม้ 1 ต้นดูดซับ CO2 ประมาณ 21.77 kg/year
    // เพื่อชดเชยรายปี
    const treesNeeded = Math.ceil(co2Kg / 21.77);

    return {
        distance,
        fuelConsumed: parseFloat(fuelConsumed.toFixed(2)),
        co2Kg: parseFloat(co2Kg.toFixed(2)),
        co2Tons: parseFloat(co2Tons.toFixed(4)),
        treesNeeded,
    };
}

/**
 * Calculate annual CO2 footprint
 */
export function calculateAnnualCO2(
    annualDistance: number,
    vehicle?: Vehicle,
    fuelType: keyof typeof EMISSION_FACTORS = 'gasoline'
): {
    totalCO2Tons: number;
    treesNeeded: number;
    offsetCost: number; // ค่าใช้จ่ายในการชดเชย (carbon credit)
    esgRating: 'A' | 'B' | 'C' | 'D' | 'F';
} {
    const emission = calculateCO2Emissions(annualDistance, vehicle, fuelType);

    // Carbon credit ประมาณ 500 บาท/ตัน CO2
    const offsetCost = emission.co2Tons * 500;

    // ESG Rating based on CO2/year
    let esgRating: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
    if (emission.co2Tons > 5) esgRating = 'F';
    else if (emission.co2Tons > 3) esgRating = 'D';
    else if (emission.co2Tons > 2) esgRating = 'C';
    else if (emission.co2Tons > 1) esgRating = 'B';

    return {
        totalCO2Tons: emission.co2Tons,
        treesNeeded: emission.treesNeeded,
        offsetCost: parseFloat(offsetCost.toFixed(2)),
        esgRating,
    };
}

/**
 * Compare emissions between vehicle types
 */
export function compareVehicleEmissions(
    distance: number,
    vehicles: Array<{ name: string; efficiency: number; fuelType: keyof typeof EMISSION_FACTORS }>
): Array<{
    name: string;
    co2Kg: number;
    savings: number; // เทียบกับค่าสูงสุด
    savingsPercent: number;
}> {
    const results = vehicles.map((v) => {
        const emission = calculateCO2Emissions(distance, { fuelEfficiency: v.efficiency } as any, v.fuelType);
        return {
            name: v.name,
            co2Kg: emission.co2Kg,
            savings: 0,
            savingsPercent: 0,
        };
    });

    const maxEmission = Math.max(...results.map((r) => r.co2Kg));

    return results.map((r) => ({
        ...r,
        savings: parseFloat((maxEmission - r.co2Kg).toFixed(2)),
        savingsPercent: parseFloat(((maxEmission - r.co2Kg) / maxEmission * 100).toFixed(2)),
    }));
}

/**
 * Calculate carbon offset recommendations
 */
export interface CarbonOffsetRecommendation {
    method: string;
    description: string;
    costPerTon: number;
    provider?: string;
}

export function getCarbonOffsetRecommendations(co2Tons: number): CarbonOffsetRecommendation[] {
    return [
        {
            method: 'ปลูกป่า',
            description: `ปลูกต้นไม้ประมาณ ${Math.ceil(co2Tons * 45)} ต้น (ชดเชย ${co2Tons.toFixed(2)} ตัน CO2)`,
            costPerTon: 300,
            provider: 'มูลนิธิรักษ์ป่า',
        },
        {
            method: 'Carbon Credit',
            description: 'ซื้อคาร์บอนเครดิตจากโครงการพลังงานสะอาด',
            costPerTon: 500,
            provider: 'Tabon Credit Exchange Thailand',
        },
        {
            method: 'พลังงานทดแทน',
            description: 'สนับสนุนโครงการพลังงานแสงอาทิตย์/ลม',
            costPerTon: 450,
            provider: 'กรมพัฒนาพลังงานทดแทน',
        },
    ];
}

/**
 * Calculate ESG score
 */
export function calculateESGScore(
    co2Tons: number,
    fuelEfficiency: number,
    distanceOptimization: number // % ปรับปรุงเส้นทาง
): {
    environmental: number; // 0-100
    efficiency: number; // 0-100
    optimization: number; // 0-100
    overall: number; // 0-100
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
} {
    // Environmental score (lower CO2 = higher score)
    const envScore = Math.max(0, Math.min(100, 100 - (co2Tons * 20)));

    // Efficiency score (higher km/l = higher score)
    const effScore = Math.min(100, (fuelEfficiency / 20) * 100);

    // Optimization score
    const optScore = Math.min(100, distanceOptimization);

    const overall = (envScore + effScore + optScore) / 3;

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (overall >= 95) grade = 'A+';
    else if (overall >= 85) grade = 'A';
    else if (overall >= 75) grade = 'B';
    else if (overall >= 65) grade = 'C';
    else if (overall >= 50) grade = 'D';

    return {
        environmental: parseFloat(envScore.toFixed(2)),
        efficiency: parseFloat(effScore.toFixed(2)),
        optimization: parseFloat(optScore.toFixed(2)),
        overall: parseFloat(overall.toFixed(2)),
        grade,
    };
}
