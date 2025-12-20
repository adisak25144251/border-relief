/**
 * Data Quality Center Module
 * ตรวจสอบ completeness, outlier, duplicate route, time gaps
 */

import type { Trip, GPSPoint } from '../utils/zod';

export interface DataQualityReport {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: DataQualityIssue[];
    metrics: {
        completeness: number; // %
        accuracy: number; // %
        consistency: number; // %
        timeliness: number; // %
    };
    recommendations: string[];
}

export interface DataQualityIssue {
    id: string;
    type: 'MISSING_DATA' | 'OUTLIER' | 'DUPLICATE' | 'TIME_GAP' | 'INVALID_FORMAT' | 'INCONSISTENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    field: string;
    description: string;
    affectedRecords: string[]; // Trip IDs
    suggestedFix?: string;
}

/**
 * Analyze data quality for trips
 */
export function analyzeDataQuality(trips: Trip[], gpsData?: Record<string, GPSPoint[]>): DataQualityReport {
    const issues: DataQualityIssue[] = [];

    // Check completeness
    const completenessIssues = checkCompleteness(trips);
    issues.push(...completenessIssues);

    // Check for outliers
    const outlierIssues = detectOutliers(trips);
    issues.push(...outlierIssues);

    // Check for duplicates
    const duplicateIssues = detectDuplicateRoutes(trips);
    issues.push(...duplicateIssues);

    // Check GPS time gaps
    if (gpsData) {
        const timeGapIssues = detectTimeGaps(gpsData);
        issues.push(...timeGapIssues);
    }

    // Calculate metrics
    const metrics = calculateQualityMetrics(trips, issues);

    // Calculate overall score
    const score = (
        metrics.completeness * 0.3 +
        metrics.accuracy * 0.3 +
        metrics.consistency * 0.2 +
        metrics.timeliness * 0.2
    );

    const grade =
        score >= 90 ? 'A' :
            score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                    score >= 60 ? 'D' : 'F';

    // Generate recommendations
    const recommendations = generateRecommendations(issues, metrics);

    return {
        score: parseFloat(score.toFixed(2)),
        grade,
        issues,
        metrics,
        recommendations,
    };
}

/**
 * Check data completeness
 */
function checkCompleteness(trips: Trip[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const requiredFields = ['title', 'startLocation', 'endLocation', 'distance', 'totalCost'];
    const optionalButImportant = ['vehicle', 'fuelPrice', 'allowance'];

    const missingRequired: Record<string, string[]> = {};
    const missingOptional: Record<string, string[]> = {};

    trips.forEach(trip => {
        requiredFields.forEach(field => {
            if (!trip[field as keyof Trip]) {
                if (!missingRequired[field]) missingRequired[field] = [];
                missingRequired[field].push(trip.id);
            }
        });

        optionalButImportant.forEach(field => {
            if (!trip[field as keyof Trip]) {
                if (!missingOptional[field]) missingOptional[field] = [];
                missingOptional[field].push(trip.id);
            }
        });
    });

    // Create issues for missing required fields
    Object.entries(missingRequired).forEach(([field, tripIds]) => {
        issues.push({
            id: `MISS-${field}-${Date.now()}`,
            type: 'MISSING_DATA',
            severity: 'CRITICAL',
            field,
            description: `ข้อมูลบังคับ "${field}" ขาดหายใน ${tripIds.length} ทริป`,
            affectedRecords: tripIds,
            suggestedFix: `กรอกข้อมูล ${field} ให้ครบถ้วน`,
        });
    });

    // Create issues for missing optional fields
    Object.entries(missingOptional).forEach(([field, tripIds]) => {
        if (tripIds.length > trips.length * 0.3) { // > 30% missing
            issues.push({
                id: `MISS-${field}-${Date.now()}`,
                type: 'MISSING_DATA',
                severity: 'MEDIUM',
                field,
                description: `ข้อมูล "${field}" ขาดหายใน ${tripIds.length} ทริป`,
                affectedRecords: tripIds.slice(0, 10), // Show first 10
                suggestedFix: `แนะนำให้กรอกข้อมูล ${field} เพื่อความครบถ้วน`,
            });
        }
    });

    return issues;
}

/**
 * Detect outliers
 */
function detectOutliers(trips: Trip[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];

    // Distance outliers
    const distances = trips.map(t => t.distance);
    const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const stdDevDist = Math.sqrt(
        distances.reduce((sum, d) => sum + Math.pow(d - meanDist, 2), 0) / distances.length
    );

    const distanceOutliers = trips.filter(t => {
        const zScore = Math.abs((t.distance - meanDist) / stdDevDist);
        return zScore > 3; // 3 standard deviations
    });

    if (distanceOutliers.length > 0) {
        issues.push({
            id: `OUT-DIST-${Date.now()}`,
            type: 'OUTLIER',
            severity: 'HIGH',
            field: 'distance',
            description: `ระยะทางผิดปกติ ${distanceOutliers.length} ทริป (เบี่ยงเบนมาตรฐาน > 3σ)`,
            affectedRecords: distanceOutliers.map(t => t.id),
            suggestedFix: 'ตรวจสอบความถูกต้องของระยะทาง',
        });
    }

    // Cost outliers
    const costs = trips.map(t => t.totalCost);
    const meanCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const stdDevCost = Math.sqrt(
        costs.reduce((sum, c) => sum + Math.pow(c - meanCost, 2), 0) / costs.length
    );

    const costOutliers = trips.filter(t => {
        const zScore = Math.abs((t.totalCost - meanCost) / stdDevCost);
        return zScore > 3;
    });

    if (costOutliers.length > 0) {
        issues.push({
            id: `OUT-COST-${Date.now()}`,
            type: 'OUTLIER',
            severity: 'HIGH',
            field: 'totalCost',
            description: `ต้นทุนผิดปกติ ${costOutliers.length} ทริป`,
            affectedRecords: costOutliers.map(t => t.id),
            suggestedFix: 'ตรวจสอบรายละเอียดค่าใช้จ่าย',
        });
    }

    return issues;
}

/**
 * Detect duplicate routes
 */
function detectDuplicateRoutes(trips: Trip[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const routeMap: Record<string, string[]> = {};

    trips.forEach(trip => {
        const key = `${trip.startLocation}→${trip.endLocation}→${trip.date}`;
        if (!routeMap[key]) routeMap[key] = [];
        routeMap[key].push(trip.id);
    });

    Object.entries(routeMap).forEach(([route, tripIds]) => {
        if (tripIds.length > 1) {
            const [start, end, date] = route.split('→');
            issues.push({
                id: `DUP-${Date.now()}-${tripIds[0]}`,
                type: 'DUPLICATE',
                severity: 'MEDIUM',
                field: 'route',
                description: `เส้นทางซ้ำกัน ${tripIds.length} ทริป: ${start} → ${end} วันที่ ${date}`,
                affectedRecords: tripIds,
                suggestedFix: 'ตรวจสอบว่าเป็นทริปเดียวกันหรือไม่ หากใช่ให้ลบข้อมูลซ้ำ',
            });
        }
    });

    return issues;
}

/**
 * Detect time gaps in GPS data
 */
function detectTimeGaps(gpsData: Record<string, GPSPoint[]>): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const maxGapMinutes = 30; // ช่องว่างไม่ควรเกิน 30 นาที

    Object.entries(gpsData).forEach(([tripId, points]) => {
        if (points.length < 2) return;

        const gaps: Array<{ index: number; minutes: number }> = [];

        for (let i = 1; i < points.length; i++) {
            const prev = new Date(points[i - 1].timestamp);
            const curr = new Date(points[i].timestamp);
            const gapMinutes = (curr.getTime() - prev.getTime()) / (1000 * 60);

            if (gapMinutes > maxGapMinutes) {
                gaps.push({ index: i, minutes: gapMinutes });
            }
        }

        if (gaps.length > 0) {
            const totalGapTime = gaps.reduce((sum, g) => sum + g.minutes, 0);
            issues.push({
                id: `GAP-${tripId}-${Date.now()}`,
                type: 'TIME_GAP',
                severity: totalGapTime > 120 ? 'HIGH' : 'MEDIUM',
                field: 'gpsPoints',
                description: `พบช่องว่างข้อมูล GPS ${gaps.length} ช่วง รวม ${totalGapTime.toFixed(0)} นาที`,
                affectedRecords: [tripId],
                suggestedFix: 'ตรวจสอบสัญญาณ GPS ในช่วงเวลาดังกล่าว',
            });
        }
    });

    return issues;
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(
    trips: Trip[],
    issues: DataQualityIssue[]
): DataQualityReport['metrics'] {
    const totalRecords = trips.length;

    // Completeness
    const missingDataIssues = issues.filter(i => i.type === 'MISSING_DATA');
    const recordsWithMissingData = new Set(missingDataIssues.flatMap(i => i.affectedRecords)).size;
    const completeness = ((totalRecords - recordsWithMissingData) / totalRecords) * 100;

    // Accuracy (based on outliers)
    const outlierIssues = issues.filter(i => i.type === 'OUTLIER');
    const recordsWithOutliers = new Set(outlierIssues.flatMap(i => i.affectedRecords)).size;
    const accuracy = ((totalRecords - recordsWithOutliers) / totalRecords) * 100;

    // Consistency (based on duplicates and time gaps)
    const duplicateIssues = issues.filter(i => i.type === 'DUPLICATE');
    const timeGapIssues = issues.filter(i => i.type === 'TIME_GAP');
    const inconsistentRecords = new Set([
        ...duplicateIssues.flatMap(i => i.affectedRecords),
        ...timeGapIssues.flatMap(i => i.affectedRecords),
    ]).size;
    const consistency = ((totalRecords - inconsistentRecords) / totalRecords) * 100;

    // Timeliness (check if data is recent)
    const now = new Date();
    const oldRecords = trips.filter(t => {
        const tripDate = new Date(t.date);
        const daysOld = (now.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > 365; // Older than 1 year
    }).length;
    const timeliness = ((totalRecords - oldRecords) / totalRecords) * 100;

    return {
        completeness: parseFloat(completeness.toFixed(2)),
        accuracy: parseFloat(accuracy.toFixed(2)),
        consistency: parseFloat(consistency.toFixed(2)),
        timeliness: parseFloat(timeliness.toFixed(2)),
    };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
    issues: DataQualityIssue[],
    metrics: DataQualityReport['metrics']
): string[] {
    const recommendations: string[] = [];

    if (metrics.completeness < 80) {
        recommendations.push('🔴 ปรับปรุงความครบถ้วนของข้อมูล: กรอกข้อมูลที่ขาดหายให้ครบถ้วน');
    }

    if (metrics.accuracy < 85) {
        recommendations.push('🔴 ตรวจสอบความถูกต้อง: ตรวจสอบค่าผิดปกติและแก้ไขข้อมูลที่ผิดพลาด');
    }

    if (metrics.consistency < 90) {
        recommendations.push('⚠️ เพิ่มความสอดคล้อง: ลบข้อมูลซ้ำและแก้ไขช่องว่างเวลา');
    }

    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
        recommendations.push(`🚨 แก้ไขปัญหาร้ายแรง ${criticalIssues.length} รายการทันที`);
    }

    const highIssues = issues.filter(i => i.severity === 'HIGH');
    if (highIssues.length > 0) {
        recommendations.push(`⚠️ จัดการปัญหาสำคัญ ${highIssues.length} รายการ`);
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ คุณภาพข้อมูลอยู่ในเกณฑ์ดี ดำเนินการต่อได้');
    }

    return recommendations;
}

/**
 * Get quality trends over time
 */
export function getQualityTrends(
    reports: Array<{ date: Date; report: DataQualityReport }>
): {
    improving: boolean;
    trend: Array<{ date: string; score: number }>;
    averageScore: number;
} {
    const sorted = [...reports].sort((a, b) => a.date.getTime() - b.date.getTime());

    const trend = sorted.map(r => ({
        date: r.date.toISOString().split('T')[0],
        score: r.report.score,
    }));

    const averageScore = trend.reduce((sum, t) => sum + t.score, 0) / trend.length;

    // Check if improving (compare first half vs second half)
    const midPoint = Math.floor(trend.length / 2);
    const firstHalfAvg = trend.slice(0, midPoint).reduce((sum, t) => sum + t.score, 0) / midPoint;
    const secondHalfAvg = trend.slice(midPoint).reduce((sum, t) => sum + t.score, 0) / (trend.length - midPoint);

    return {
        improving: secondHalfAvg > firstHalfAvg,
        trend,
        averageScore: parseFloat(averageScore.toFixed(2)),
    };
}
