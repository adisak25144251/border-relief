import type { Trip, GPSPoint } from '../utils/zod';

/**
 * Anomaly types
 */
export enum AnomalyType {
    EXCESSIVE_DISTANCE = 'EXCESSIVE_DISTANCE',
    UNUSUAL_ROUTE = 'UNUSUAL_ROUTE',
    SPEED_ANOMALY = 'SPEED_ANOMALY',
    GPS_DRIFT = 'GPS_DRIFT',
    TIME_DISCREPANCY = 'TIME_DISCREPANCY',
    COST_OUTLIER = 'COST_OUTLIER',
    SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
}

export interface Anomaly {
    type: AnomalyType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    tripId: string;
    description: string;
    details: any;
    confidence: number; // 0-1
    timestamp: Date;
}

/**
 * Detect excessive distance anomalies
 */
export function detectExcessiveDistance(trip: Trip): Anomaly | null {
    // Calculate straight-line distance
    const R = 6371; // Earth radius in km
    const dLat = ((trip.endCoords.lat - trip.startCoords.lat) * Math.PI) / 180;
    const dLon = ((trip.endCoords.lng - trip.startCoords.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((trip.startCoords.lat * Math.PI) / 180) *
        Math.cos((trip.endCoords.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLine = R * c;

    // Expected road distance is 1.2-2.5x straight line
    const minExpected = straightLine * 1.2;
    const maxExpected = straightLine * 2.5;

    if (trip.distance > maxExpected * 1.5) {
        // 50% over max expected
        return {
            type: AnomalyType.EXCESSIVE_DISTANCE,
            severity: 'HIGH',
            tripId: trip.id,
            description: `ระยะทางผิดปกติสูงกว่าที่คาดการณ์`,
            details: {
                reportedDistance: trip.distance,
                straightLineDistance: straightLine,
                expectedMax: maxExpected,
                deviation: ((trip.distance - maxExpected) / maxExpected) * 100,
            },
            confidence: 0.85,
            timestamp: new Date(),
        };
    }

    return null;
}

/**
 * Detect GPS drift anomalies
 */
export function detectGPSDrift(gpsPoints: GPSPoint[]): Anomaly | null {
    if (gpsPoints.length < 2) return null;

    let driftCount = 0;
    const threshold = 100; // meters

    for (let i = 1; i < gpsPoints.length; i++) {
        const prev = gpsPoints[i - 1];
        const curr = gpsPoints[i];

        if (curr.accuracy && curr.accuracy > threshold) {
            driftCount++;
        }

        // Check for impossible speed
        const timeDiff =
            (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000; // seconds
        if (timeDiff > 0) {
            const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            const speed = (distance / timeDiff) * 3.6; // km/h

            if (speed > 200) {
                // Over 200 km/h is suspicious
                driftCount++;
            }
        }
    }

    const driftRate = driftCount / gpsPoints.length;

    if (driftRate > 0.3) {
        // 30% drift rate
        return {
            type: AnomalyType.GPS_DRIFT,
            severity: driftRate > 0.5 ? 'HIGH' : 'MEDIUM',
            tripId: 'GPS-ANALYSIS',
            description: `พบการดริฟท์ของสัญญาณ GPS ${(driftRate * 100).toFixed(0)}%`,
            details: {
                totalPoints: gpsPoints.length,
                driftPoints: driftCount,
                driftRate,
            },
            confidence: 0.75,
            timestamp: new Date(),
        };
    }

    return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Detect cost outliers
 */
export function detectCostOutlier(trip: Trip, allTrips: Trip[]): Anomaly | null {
    if (allTrips.length < 10) return null; // Need enough data

    // Calculate cost per km for all trips
    const costsPerKm = allTrips.map(t => t.totalCost / t.distance).filter(c => !isNaN(c) && isFinite(c));

    // Calculate statistics
    const mean = costsPerKm.reduce((sum, c) => sum + c, 0) / costsPerKm.length;
    const variance = costsPerKm.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / costsPerKm.length;
    const stdDev = Math.sqrt(variance);

    const tripCostPerKm = trip.totalCost / trip.distance;
    const zScore = (tripCostPerKm - mean) / stdDev;

    // Z-score > 3 is usually an outlier
    if (Math.abs(zScore) > 3) {
        return {
            type: AnomalyType.COST_OUTLIER,
            severity: Math.abs(zScore) > 4 ? 'HIGH' : 'MEDIUM',
            tripId: trip.id,
            description: `ต้นทุนต่อกิโลเมตรผิดปกติ ${zScore > 0 ? 'สูงกว่า' : 'ต่ำกว่า'}ค่าเฉลี่ย`,
            details: {
                costPerKm: tripCostPerKm,
                averageCostPerKm: mean,
                standardDeviation: stdDev,
                zScore,
                deviation: ((tripCostPerKm - mean) / mean) * 100,
            },
            confidence: 0.88,
            timestamp: new Date(),
        };
    }

    return null;
}

/**
 * Detect speed anomalies
 */
export function detectSpeedAnomaly(gps Points: GPSPoint[]): Anomaly | null {
    if (gpsPoints.length < 2) return null;

    const suspiciousSpeeds: any[] = [];

    for (let i = 1; i < gpsPoints.length; i++) {
        const prev = gpsPoints[i - 1];
        const curr = gpsPoints[i];

        const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
        if (timeDiff <= 0) continue;

        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        const speed = (distance / timeDiff) * 3.6; // km/h

        if (speed > 150) {
            // Government vehicles shouldn't exceed 150 km/h
            suspiciousSpeeds.push({
                index: i,
                speed,
                timestamp: curr.timestamp,
            });
        }
    }

    if (suspiciousSpeeds.length > 0) {
        const maxSpeed = Math.max(...suspiciousSpeeds.map(s => s.speed));

        return {
            type: AnomalyType.SPEED_ANOMALY,
            severity: maxSpeed > 180 ? 'CRITICAL' : maxSpeed > 150 ? 'HIGH' : 'MEDIUM',
            tripId: 'SPEED-ANALYSIS',
            description: `ตรวจพบความเร็วผิดปกติสูงสุด ${maxSpeed.toFixed(0)} กม./ชม.`,
            details: {
                maxSpeed,
                suspiciousCount: suspiciousSpeeds.length,
                occurrences: suspiciousSpeeds.slice(0, 5), // Top 5
            },
            confidence: 0.92,
            timestamp: new Date(),
        };
    }

    return null;
}

/**
 * Comprehensive anomaly detection
 */
export function detectAllAnomalies(
    trip: Trip,
    allTrips: Trip[],
    gpsPoints?: GPSPoint[]
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Distance anomaly
    const distanceAnomaly = detectExcessiveDistance(trip);
    if (distanceAnomaly) anomalies.push(distanceAnomaly);

    // Cost anomaly
    const costAnomaly = detectCostOutlier(trip, allTrips);
    if (costAnomaly) anomalies.push(costAnomaly);

    // GPS-based anomalies
    if (gpsPoints && gpsPoints.length > 0) {
        const driftAnomaly = detectGPSDrift(gpsPoints);
        if (driftAnomaly) {
            driftAnomaly.tripId = trip.id;
            anomalies.push(driftAnomaly);
        }

        const speedAnomaly = detectSpeedAnomaly(gpsPoints);
        if (speedAnomaly) {
            speedAnomaly.tripId = trip.id;
            anomalies.push(speedAnomaly);
        }
    }

    return anomalies;
}

/**
 * Calculate anomaly risk score
 */
export function calculateRiskScore(anomalies: Anomaly[]): {
    score: number; // 0-100
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
    if (anomalies.length === 0) {
        return { score: 0, level: 'LOW' };
    }

    // Weighted score based on severity
    const severityWeights = {
        LOW: 10,
        MEDIUM: 25,
        HIGH: 50,
        CRITICAL: 100,
    };

    const totalScore = anomalies.reduce((sum, a) => {
        return sum + severityWeights[a.severity] * a.confidence;
    }, 0);

    const normalizedScore = Math.min(100, totalScore / anomalies.length);

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (normalizedScore > 75) level = 'CRITICAL';
    else if (normalizedScore > 50) level = 'HIGH';
    else if (normalizedScore > 25) level = 'MEDIUM';

    return {
        score: parseFloat(normalizedScore.toFixed(2)),
        level,
    };
}
