import type { Trip } from '../utils/zod';

/**
 * Trip cluster
 */
export interface TripCluster {
    id: string;
    name: string;
    trips: Trip[];
    centroid: {
        lat: number;
        lng: number;
    };
    commonDestinations: string[];
    averageDistance: number;
    averageCost: number;
    frequency: number; // trips per month
}

/**
 * K-means clustering for trips
 */
export function clusterTripsByDestination(trips: Trip[], k: number = 5): TripCluster[] {
    if (trips.length < k) {
        k = Math.max(1, trips.length);
    }

    // Initialize centroids randomly
    const centroids: Array<{ lat: number; lng: number }> = [];
    const shuffled = [...trips].sort(() => Math.random() - 0.5);

    for (let i = 0; i < k; i++) {
        centroids.push({
            lat: shuffled[i].endCoords.lat,
            lng: shuffled[i].endCoords.lng,
        });
    }

    // Iterate until convergence
    let iterations = 0;
    const maxIterations = 50;
    let assignments: number[] = new Array(trips.length).fill(0);
    let converged = false;

    while (!converged && iterations < maxIterations) {
        iterations++;
        const newAssignments: number[] = [];

        // Assign each trip to nearest centroid
        for (const trip of trips) {
            let minDistance = Infinity;
            let clusterIndex = 0;

            for (let i = 0; i < centroids.length; i++) {
                const distance = calculateDistance(
                    trip.endCoords.lat,
                    trip.endCoords.lng,
                    centroids[i].lat,
                    centroids[i].lng
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    clusterIndex = i;
                }
            }

            newAssignments.push(clusterIndex);
        }

        // Check convergence
        converged = newAssignments.every((val, idx) => val === assignments[idx]);
        assignments = newAssignments;

        // Update centroids
        if (!converged) {
            for (let i = 0; i < k; i++) {
                const clusterTrips = trips.filter((_, idx) => assignments[idx] === i);

                if (clusterTrips.length > 0) {
                    centroids[i] = {
                        lat: clusterTrips.reduce((sum, t) => sum + t.endCoords.lat, 0) / clusterTrips.length,
                        lng: clusterTrips.reduce((sum, t) => sum + t.endCoords.lng, 0) / clusterTrips.length,
                    };
                }
            }
        }
    }

    // Build cluster objects
    const clusters: TripCluster[] = [];

    for (let i = 0; i < k; i++) {
        const clusterTrips = trips.filter((_, idx) => assignments[idx] === i);

        if (clusterTrips.length === 0) continue;

        // Find common destinations
        const destCounts: Record<string, number> = {};
        clusterTrips.forEach(trip => {
            destCounts[trip.endLocation] = (destCounts[trip.endLocation] || 0) + 1;
        });

        const commonDestinations = Object.entries(destCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([dest]) => dest);

        const averageDistance = clusterTrips.reduce((sum, t) => sum + t.distance, 0) / clusterTrips.length;
        const averageCost = clusterTrips.reduce((sum, t) => sum + t.totalCost, 0) / clusterTrips.length;

        clusters.push({
            id: `CLUSTER-${i + 1}`,
            name: commonDestinations[0] || `กลุ่ม ${i + 1}`,
            trips: clusterTrips,
            centroid: centroids[i],
            commonDestinations,
            averageDistance: parseFloat(averageDistance.toFixed(2)),
            averageCost: parseFloat(averageCost.toFixed(2)),
            frequency: 0, // Will be calculated separately
        });
    }

    return clusters.sort((a, b) => b.trips.length - a.trips.length);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
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
 * Find frequent routes
 */
export interface FrequentRoute {
    from: string;
    to: string;
    count: number;
    trips: Trip[];
    averageDistance: number;
    averageCost: number;
    costPerKm: number;
}

export function findFrequentRoutes(trips: Trip[], minOccurrences: number = 3): FrequentRoute[] {
    const routeMap: Record<string, Trip[]> = {};

    trips.forEach(trip => {
        const key = `${trip.startLocation}→${trip.endLocation}`;
        if (!routeMap[key]) {
            routeMap[key] = [];
        }
        routeMap[key].push(trip);
    });

    const frequentRoutes: FrequentRoute[] = [];

    Object.entries(routeMap).forEach(([routeKey, routeTrips]) => {
        if (routeTrips.length >= minOccurrences) {
            const [from, to] = routeKey.split('→');
            const avgDistance = routeTrips.reduce((sum, t) => sum + t.distance, 0) / routeTrips.length;
            const avgCost = routeTrips.reduce((sum, t) => sum + t.totalCost, 0) / routeTrips.length;

            frequentRoutes.push({
                from,
                to,
                count: routeTrips.length,
                trips: routeTrips,
                averageDistance: parseFloat(avgDistance.toFixed(2)),
                averageCost: parseFloat(avgCost.toFixed(2)),
                costPerKm: parseFloat((avgCost / avgDistance).toFixed(2)),
            });
        }
    });

    return frequentRoutes.sort((a, b) => b.count - a.count);
}

/**
 * Cluster by time patterns (e.g., monthly frequency)
 */
export function clusterByTimePattern(trips: Trip[]): {
    monthly: Record<string, Trip[]>;
    dayOfWeek: Record<string, Trip[]>;
    seasonal: Record<string, Trip[]>;
} {
    const monthly: Record<string, Trip[]> = {};
    const dayOfWeek: Record<string, Trip[]> = {};
    const seasonal: Record<string, Trip[]> = {};

    trips.forEach(trip => {
        const date = new Date(trip.date);

        // Monthly
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[monthKey]) monthly[monthKey] = [];
        monthly[monthKey].push(trip);

        // Day of week
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const dayKey = days[date.getDay()];
        if (!dayOfWeek[dayKey]) dayOfWeek[dayKey] = [];
        dayOfWeek[dayKey].push(trip);

        // Seasonal (Thai seasons)
        const month = date.getMonth();
        let season = '';
        if (month >= 2 && month <= 5) season = 'ฤดูร้อน';
        else if (month >= 6 && month <= 9) season = 'ฤดูฝน';
        else season = 'ฤดูหนาว';

        if (!seasonal[season]) seasonal[season] = [];
        seasonal[season].push(trip);
    });

    return { monthly, dayOfWeek, seasonal };
}

/**
 * Analyze cluster insights
 */
export function analyzeClusterInsights(clusters: TripCluster[]): string[] {
    const insights: string[] = [];

    // Largest cluster
    if (clusters.length > 0) {
        const largest = clusters[0];
        const percentage = (largest.trips.length / clusters.reduce((sum, c) => sum + c.trips.length, 0)) * 100;
        insights.push(
            `กลุ่มเส้นทางหลักคือ "${largest.name}" คิดเป็น ${percentage.toFixed(0)}% ของทริปทั้งหมด`
        );
    }

    // Cost efficiency comparison
    if (clusters.length > 1) {
        const sorted = [...clusters].sort((a, b) => (a.averageCost / a.averageDistance) - (b.averageCost / b.averageDistance));
        const mostEfficient = sorted[0];
        const leastEfficient = sorted[sorted.length - 1];

        insights.push(
            `เส้นทาง "${mostEfficient.name}" มีต้นทุนต่อกม.ต่ำสุด (${(mostEfficient.averageCost / mostEfficient.averageDistance).toFixed(2)} บาท/กม.)`
        );

        if (leastEfficient.id !== mostEfficient.id) {
            insights.push(
                `เส้นทาง "${leastEfficient.name}" มีต้นทุนสูงที่สุด (${(leastEfficient.averageCost / leastEfficient.averageDistance).toFixed(2)} บาท/กม.)`
            );
        }
    }

    // Distance insights
    const totalTrips = clusters.reduce((sum, c) => sum + c.trips.length, 0);
    const longDistanceClusters = clusters.filter(c => c.averageDistance > 100);

    if (longDistanceClusters.length > 0) {
        const longDistanceTrips = longDistanceClusters.reduce((sum, c) => sum + c.trips.length, 0);
        const percentage = (longDistanceTrips / totalTrips) * 100;
        insights.push(
            `${percentage.toFixed(0)}% ของทริปเป็นระยะทางไกล (>100 กม.)`
        );
    }

    return insights;
}
