import type { Trip } from '../utils/zod';
import type { Anomaly } from './anomaly';

/**
 * AI-powered trip summary
 */
export interface TripSummary {
    tripId: string;
    overview: string;
    highlights: string[];
    concerns: string[];
    recommendations: string[];
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    score: number; // 0-100
}

/**
 * Generate AI summary for a trip
 */
export function generateTripSummary(
    trip: Trip,
    anomalies?: Anomaly[]
): TripSummary {
    const highlights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze distance
    const costPerKm = trip.totalCost / trip.distance;
    if (costPerKm < 15) {
        highlights.push(`ต้นทุนต่อกม.อยู่ในระดับที่ดี (${costPerKm.toFixed(2)} บาท/กม.)`);
    } else if (costPerKm > 25) {
        concerns.push(`ต้นทุนต่อกม.สูงกว่าค่าเฉลี่ย (${costPerKm.toFixed(2)} บาท/กม.)`);
        recommendations.push('พิจารณาเปลี่ยนเส้นทางหรือวิธีการเดินทางเพื่อลดต้นทุน');
    }

    // Analyze anomalies
    if (anomalies && anomalies.length > 0) {
        const highSeverity = anomalies.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
        if (highSeverity.length > 0) {
            concerns.push(`ตรวจพบความผิดปกติ ${highSeverity.length} รายการ ที่ต้องตรวจสอบเร่งด่วน`);
            recommendations.push('ตรวจสอบรายละเอียดความผิดปกติและแก้ไขข้อมูล');
        } else {
            concerns.push(`พบความผิดปกติเล็กน้อย ${anomalies.length} รายการ`);
        }
    } else {
        highlights.push('ไม่พบความผิดปกติในข้อมูล');
    }

    // Status-based insights
    if (trip.status === 'อนุมัติแล้ว') {
        highlights.push('ทริปได้รับการอนุมัติแล้ว พร้อมดำเนินการ');
    } else if (trip.status === 'ตรวจสอบแล้ว') {
        highlights.push('ทริปผ่านการตรวจสอบและยืนยันแล้ว');
    } else if (trip.status === 'รออนุมัติ') {
        recommendations.push('รอการอนุมัติจากผู้บังคับบัญชา');
    }

  /Distance efficiency
    if (trip.distance > 200) {
        highlights.push(`เส้นทางระยะไกล ${trip.distance.toFixed(0)} กม.`);
        recommendations.push('พิจารณาแบ่งการเดินทางเป็นหลายวันเพื่อความปลอดภัย');
    }

    // Calculate overall score
    let score = 70; // Base score
    if (anomalies) {
        score -= anomalies.length * 5;
        score -= anomalies.filter(a => a.severity === 'HIGH').length * 10;
        score -= anomalies.filter(a => a.severity === 'CRITICAL').length * 20;
    }
    if (costPerKm < 15) score += 15;
    else if (costPerKm > 25) score -= 10;
    if (trip.status === 'ตรวจสอบแล้ว') score += 10;
    score = Math.max(0, Math.min(100, score));

    const efficiency: 'excellent' | 'good' | 'fair' | 'poor' =
        score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';

    // Generate overview
    const statusThai = trip.status;
    const overview = `ทริป "${trip.title}" มีระยะทาง ${trip.distance.toFixed(0)} กม. ต้นทุนรวม ${trip.totalCost.toLocaleString('th-TH')} บาท สถานะ: ${statusThai} คะแนนประสิทธิภาพ: ${score}/100 (${efficiency === 'excellent' ? 'ดีเยี่ยม' : efficiency === 'good' ? 'ดี' : efficiency === 'fair' ? 'พอใช้' : 'ควรปรับปรุง'})`;

    return {
        tripId: trip.id,
        overview,
        highlights,
        concerns,
        recommendations,
        efficiency,
        score,
    };
}

/**
 * Generate batch summary for multiple trips
 */
export interface BatchSummary {
    totalTrips: number;
    totalDistance: number;
    totalCost: number;
    averageCostPerKm: number;
    statusBreakdown: Record<string, number>;
    topIssues: string[];
    topRecommendations: string[];
    overallEfficiency: number;
    trends: {
        improving: boolean;
        description: string;
    };
}

export function generateBatchSummary(trips: Trip[]): BatchSummary {
    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const totalCost = trips.reduce((sum, t) => sum + t.totalCost, 0);
    const averageCostPerKm = totalCost / totalDistance;

    const statusBreakdown = trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Collect issues and recommendations
    const allConcerns: string[] = [];
    const allRecommendations: string[] = [];
    let totalScore = 0;

    trips.forEach(trip => {
        const summary = generateTripSummary(trip);
        allConcerns.push(...summary.concerns);
        allRecommendations.push(...summary.recommendations);
        totalScore += summary.score;
    });

    // Find top issues/recommendations by frequency
    const concernCounts = allConcerns.reduce((acc, c) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const recommendationCounts = allRecommendations.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topIssues = Object.entries(concernCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue]) => issue);

    const topRecommendations = Object.entries(recommendationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([rec]) => rec);

    const overallEfficiency = totalScore / trips.length;

    // Simple trend analysis (compare first half vs second half)
    const midPoint = Math.floor(trips.length / 2);
    if (trips.length >= 10) {
        const firstHalf = trips.slice(0, midPoint);
        const secondHalf = trips.slice(midPoint);

        const firstAvg = firstHalf.reduce((sum, t) => sum + t.totalCost / t.distance, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, t) => sum + t.totalCost / t.distance, 0) / secondHalf.length;

        const improving = secondAvg < firstAvg;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        return {
            totalTrips: trips.length,
            totalDistance,
            totalCost,
            averageCostPerKm,
            statusBreakdown,
            topIssues,
            topRecommendations,
            overallEfficiency,
            trends: {
                improving,
                description: improving
                    ? `ต้นทุนลดลง ${Math.abs(change).toFixed(1)}% เมื่อเทียบช่วงครึ่งแรก`
                    : `ต้นทุนเพิ่มขึ้น ${Math.abs(change).toFixed(1)}% เมื่อเทียบช่วงครึ่งแรก`,
            },
        };
    }

    return {
        totalTrips: trips.length,
        totalDistance,
        totalCost,
        averageCostPerKm,
        statusBreakdown,
        topIssues,
        topRecommendations,
        overallEfficiency,
        trends: {
            improving: true,
            description: 'ข้อมูลยังไม่เพียงพอสำหรับการวิเคราะห์แนวโน้ม (ต้องการอย่างน้อย 10 ทริป)',
        },
    };
}

/**
 * Generate natural language insights
 */
export function generateInsights(trips: Trip[]): string[] {
    const insights: string[] = [];

    if (trips.length === 0) {
        return ['ยังไม่มีข้อมูลการเดินทาง'];
    }

    const batchSummary = generateBatchSummary(trips);

    insights.push(
        `มีทริปทั้งหมด ${trips.length} ทริป ระยะทางรวม ${batchSummary.totalDistance.toLocaleString('th-TH')} กม. ต้นทุนรวม ${batchSummary.totalCost.toLocaleString('th-TH')} บาท`
    );

    insights.push(
        `ค่าเฉลี่ยต่อกิโลเมตร: ${batchSummary.averageCostPerKm.toFixed(2)} บาท/กม.`
    );

    if (batchSummary.trends.improving) {
        insights.push(`✅ ${batchSummary.trends.description}`);
    } else {
        insights.push(`⚠️ ${batchSummary.trends.description}`);
    }

    // Status distribution
    const statusEntries = Object.entries(batchSummary.statusBreakdown);
    if (statusEntries.length > 0) {
        const dominant = statusEntries.sort((a, b) => b[1] - a[1])[0];
        insights.push(`สถานะส่วนใหญ่: ${dominant[0]} (${dominant[1]} ทริป)`);
    }

    // Efficiency rating
    if (batchSummary.overallEfficiency >= 80) {
        insights.push('ประสิทธิภาพโดยรวม: ดีเยี่ยม 🌟');
    } else if (batchSummary.overallEfficiency >= 65) {
        insights.push('ประสิทธิภาพโดยรวม: ดี');
    } else {
        insights.push('ประสิทธิภาพโดยรวม: ควรปรับปรุง');
    }

    return insights;
}
