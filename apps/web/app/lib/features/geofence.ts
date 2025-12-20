/**
 * Geofence & Alert Module
 * ระบบแจ้งเตือนเมื่อเข้า/ออกพื้นที่, เกินความเร็ว, ออกนอกเส้นทาง
 */

import type { GPSPoint, Trip } from '../utils/zod';

export interface Geofence {
    id: string;
    name: string;
    type: 'CIRCLE' | 'POLYGON' | 'CORRIDOR'; // Corridor = buffer around route
    center?: { lat: number; lng: number }; // For CIRCLE
    radius?: number; // For CIRCLE (meters)
    polygon?: Array<{ lat: number; lng: number }>; // For POLYGON
    routeBuffer?: number; // For CORRIDOR (meters from route)
    active: boolean;
    alerts: {
        onEnter: boolean;
        onExit: boolean;
        onDwell: boolean; // Stay too long
        dwellMinutes?: number;
    };
}

export interface GeofenceAlert {
    id: string;
    timestamp: Date;
    type: 'ENTER' | 'EXIT' | 'DWELL' | 'SPEED' | 'OFF_ROUTE';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    tripId: string;
    geofenceId?: string;
    geofenceName?: string;
    location: { lat: number; lng: number };
    details: any;
    acknowledged: boolean;
}

/**
 * Check if point is inside circle geofence
 */
function isPointInCircle(
    point: { lat: number; lng: number },
    center: { lat: number; lng: number },
    radiusMeters: number
): boolean {
    const R = 6371000; // Earth radius in meters
    const dLat = ((point.lat - center.lat) * Math.PI) / 180;
    const dLon = ((point.lng - center.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((center.lat * Math.PI) / 180) *
        Math.cos((point.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
function isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: Array<{ lat: number; lng: number }>
): boolean {
    let inside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;

        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Check if point is inside geofence
 */
export function isInsideGeofence(
    point: { lat: number; lng: number },
    geofence: Geofence
): boolean {
    if (!geofence.active) return false;

    switch (geofence.type) {
        case 'CIRCLE':
            if (geofence.center && geofence.radius) {
                return isPointInCircle(point, geofence.center, geofence.radius);
            }
            return false;

        case 'POLYGON':
            if (geofence.polygon && geofence.polygon.length >= 3) {
                return isPointInPolygon(point, geofence.polygon);
            }
            return false;

        case 'CORRIDOR':
            // Would need route data - simplified for now
            return false;

        default:
            return false;
    }
}

/**
 * Monitor geofence crossings
 */
export function detectGeofenceCrossing(
    previousPoint: GPSPoint,
    currentPoint: GPSPoint,
    geofences: Geofence[],
    tripId: string
): GeofenceAlert[] {
    const alerts: GeofenceAlert[] = [];

    geofences.forEach(geofence => {
        const wasInside = isInsideGeofence(previousPoint, geofence);
        const isInside = isInsideGeofence(currentPoint, geofence);

        // Entry
        if (!wasInside && isInside && geofence.alerts.onEnter) {
            alerts.push({
                id: `ALERT-${Date.now()}-${Math.random()}`,
                timestamp: new Date(currentPoint.timestamp),
                type: 'ENTER',
                severity: 'INFO',
                tripId,
                geofenceId: geofence.id,
                geofenceName: geofence.name,
                location: { lat: currentPoint.lat, lng: currentPoint.lng },
                details: { geofenceType: geofence.type },
                acknowledged: false,
            });
        }

        // Exit
        if (wasInside && !isInside && geofence.alerts.onExit) {
            alerts.push({
                id: `ALERT-${Date.now()}-${Math.random()}`,
                timestamp: new Date(currentPoint.timestamp),
                type: 'EXIT',
                severity: 'WARNING',
                tripId,
                geofenceId: geofence.id,
                geofenceName: geofence.name,
                location: { lat: currentPoint.lat, lng: currentPoint.lng },
                details: { geofenceType: geofence.type },
                acknowledged: false,
            });
        }
    });

    return alerts;
}

/**
 * Detect speed violations
 */
export function detectSpeedViolation(
    previousPoint: GPSPoint,
    currentPoint: GPSPoint,
    speedLimitKmh: number,
    tripId: string
): GeofenceAlert | null {
    const timeDiff =
        (new Date(currentPoint.timestamp).getTime() - new Date(previousPoint.timestamp).getTime()) / 1000;

    if (timeDiff <= 0) return null;

    // Calculate distance
    const R = 6371000; // meters
    const dLat = ((currentPoint.lat - previousPoint.lat) * Math.PI) / 180;
    const dLon = ((currentPoint.lng - previousPoint.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((previousPoint.lat * Math.PI) / 180) *
        Math.cos((currentPoint.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const speedKmh = (distance / timeDiff) * 3.6;

    if (speedKmh > speedLimitKmh) {
        const severity: 'INFO' | 'WARNING' | 'CRITICAL' =
            speedKmh > speedLimitKmh * 1.5
                ? 'CRITICAL'
                : speedKmh > speedLimitKmh * 1.2
                    ? 'WARNING'
                    : 'INFO';

        return {
            id: `ALERT-${Date.now()}-${Math.random()}`,
            timestamp: new Date(currentPoint.timestamp),
            type: 'SPEED',
            severity,
            tripId,
            location: { lat: currentPoint.lat, lng: currentPoint.lng },
            details: {
                currentSpeed: parseFloat(speedKmh.toFixed(2)),
                speedLimit: speedLimitKmh,
                excess: parseFloat((speedKmh - speedLimitKmh).toFixed(2)),
            },
            acknowledged: false,
        };
    }

    return null;
}

/**
 * Detect off-route deviation
 */
export function detectOffRoute(
    currentPoint: GPSPoint,
    plannedRoute: Array<{ lat: number; lng: number }>,
    maxDeviationMeters: number,
    tripId: string
): GeofenceAlert | null {
    if (plannedRoute.length < 2) return null;

    // Find minimum distance to route
    let minDistance = Infinity;

    for (let i = 0; i < plannedRoute.length - 1; i++) {
        const distance = distanceToSegment(
            currentPoint,
            plannedRoute[i],
            plannedRoute[i + 1]
        );

        if (distance < minDistance) {
            minDistance = distance;
        }
    }

    if (minDistance > maxDeviationMeters) {
        return {
            id: `ALERT-${Date.now()}-${Math.random()}`,
            timestamp: new Date(currentPoint.timestamp),
            type: 'OFF_ROUTE',
            severity: minDistance > maxDeviationMeters * 2 ? 'CRITICAL' : 'WARNING',
            tripId,
            location: { lat: currentPoint.lat, lng: currentPoint.lng },
            details: {
                deviation: parseFloat(minDistance.toFixed(2)),
                maxAllowed: maxDeviationMeters,
            },
            acknowledged: false,
        };
    }

    return null;
}

function distanceToSegment(
    point: { lat: number; lng: number },
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number }
): number {
    // Simplified - calculate perpendicular distance to line segment
    // In production, use proper geospatial library like Turf.js

    const pointToStart = calculateDistance(point, lineStart);
    const pointToEnd = calculateDistance(point, lineEnd);
    const lineLength = calculateDistance(lineStart, lineEnd);

    // Use minimum distance as approximation
    return Math.min(pointToStart, pointToEnd);
}

function calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
): number {
    const R = 6371000; // meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Create common geofences
 */
export function createGovernmentBuildingGeofence(
    name: string,
    center: { lat: number; lng: number },
    radiusMeters: number = 500
): Geofence {
    return {
        id: `GEO-${Date.now()}`,
        name,
        type: 'CIRCLE',
        center,
        radius: radiusMeters,
        active: true,
        alerts: {
            onEnter: true,
            onExit: true,
            onDwell: false,
        },
    };
}

/**
 * Get alert statistics
 */
export function getAlertStatistics(alerts: GeofenceAlert[]): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unacknowledged: number;
} {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let unacknowledged = 0;

    alerts.forEach(alert => {
        byType[alert.type] = (byType[alert.type] || 0) + 1;
        bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
        if (!alert.acknowledged) unacknowledged++;
    });

    return {
        total: alerts.length,
        byType,
        bySeverity,
        unacknowledged,
    };
}
