/**
 * BI Export API Module
 * Dataset Export API ให้ต่อ BI ภายนอกได้
 */

import type { Trip } from '../utils/zod';

export interface BIExportConfig {
    format: 'JSON' | 'CSV' | 'PARQUET' | 'ARROW';
    compression?: 'gzip' | 'brotli' | 'none';
    includeMetadata: boolean;
    batchSize?: number;
}

export interface BIDataset {
    name: string;
    description: string;
    schema: BIFieldSchema[];
    totalRecords: number;
    lastUpdated: Date;
    apiEndpoint: string;
}

export interface BIFieldSchema {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    description: string;
    nullable: boolean;
    example?: any;
}

/**
 * Available BI datasets
 */
export const BI_DATASETS: Record<string, BIDataset> = {
    trips: {
        name: 'trips',
        description: 'Government trip records with costs and GPS data',
        schema: [
            { name: 'id', type: 'string', description: 'Unique trip identifier', nullable: false, example: 'T-0001' },
            { name: 'title', type: 'string', description: 'Trip mission title', nullable: false },
            { name: 'date', type: 'date', description: 'Trip date', nullable: false },
            { name: 'startLocation', type: 'string', description: 'Starting location name', nullable: false },
            { name: 'startLat', type: 'number', description: 'Starting latitude', nullable: false },
            { name: 'startLng', type: 'number', description: 'Starting longitude', nullable: false },
            { name: 'endLocation', type: 'string', description: 'Destination name', nullable: false },
            { name: 'endLat', type: 'number', description: 'Destination latitude', nullable: false },
            { name: 'endLng', type: 'number', description: 'Destination longitude', nullable: false },
            { name: 'distance', type: 'number', description: 'Total distance in km', nullable: false },
            { name: 'fuelCost', type: 'number', description: 'Fuel cost in THB', nullable: true },
            { name: 'allowance', type: 'number', description: 'Daily allowance in THB', nullable: true },
            { name: 'accommodation', type: 'number', description: 'Accommodation cost in THB', nullable: true },
            { name: 'totalCost', type: 'number', description: 'Total trip cost in THB', nullable: false },
            { name: 'status', type: 'string', description: 'Trip status', nullable: false },
            { name: 'vehicle', type: 'string', description: 'Vehicle identifier', nullable: true },
        ],
        totalRecords: 0,
        lastUpdated: new Date(),
        apiEndpoint: '/api/bi/datasets/trips',
    },

    costs: {
        name: 'costs',
        description: 'Detailed cost breakdown by category',
        schema: [
            { name: 'tripId', type: 'string', description: 'Related trip ID', nullable: false },
            { name: 'category', type: 'string', description: 'Cost category', nullable: false },
            { name: 'amount', type: 'number', description: 'Amount in THB', nullable: false },
            { name: 'date', type: 'date', description: 'Cost incurred date', nullable: false },
        ],
        totalRecords: 0,
        lastUpdated: new Date(),
        apiEndpoint: '/api/bi/datasets/costs',
    },

    analytics: {
        name: 'analytics',
        description: 'Pre-aggregated analytics data',
        schema: [
            { name: 'period', type: 'string', description: 'Time period (YYYY-MM)', nullable: false },
            { name: 'totalTrips', type: 'number', description: 'Number of trips', nullable: false },
            { name: 'totalDistance', type: 'number', description: 'Total distance in km', nullable: false },
            { name: 'totalCost', type: 'number', description: 'Total cost in THB', nullable: false },
            { name: 'avgCostPerKm', type: 'number', description: 'Average cost per km', nullable: false },
        ],
        totalRecords: 0,
        lastUpdated: new Date(),
        apiEndpoint: '/api/bi/datasets/analytics',
    },
};

/**
 * Export dataset for BI
 */
export function exportDatasetForBI(
    datasetName: string,
    trips: Trip[],
    config: BIExportConfig
): {
    data: any;
    metadata: {
        dataset: string;
        recordCount: number;
        exportedAt: Date;
        format: string;
        compression?: string;
    };
} {
    const dataset = BI_DATASETS[datasetName];

    if (!dataset) {
        throw new Error(`Unknown dataset: ${datasetName}`);
    }

    let data: any;

    switch (datasetName) {
        case 'trips':
            data = formatTripsForBI(trips);
            break;

        case 'costs':
            data = formatCostsForBI(trips);
            break;

        case 'analytics':
            data = formatAnalyticsForBI(trips);
            break;

        default:
            data = trips;
    }

    // Apply batching if needed
    if (config.batchSize && data.length > config.batchSize) {
        data = data.slice(0, config.batchSize);
    }

    const metadata = {
        dataset: datasetName,
        recordCount: data.length,
        exportedAt: new Date(),
        format: config.format,
        compression: config.compression,
    };

    // Format based on config
    switch (config.format) {
        case 'JSON':
            return { data, metadata };

        case 'CSV':
            return {
                data: convertToCSV(data),
                metadata,
            };

        default:
            return { data, metadata };
    }
}

/**
 * Format trips for BI consumption
 */
function formatTripsForBI(trips: Trip[]): any[] {
    return trips.map(trip => ({
        id: trip.id,
        title: trip.title,
        date: typeof trip.date === 'string' ? trip.date : trip.date.toISOString().split('T')[0],
        startLocation: trip.startLocation,
        startLat: trip.startCoords.lat,
        startLng: trip.startCoords.lng,
        endLocation: trip.endLocation,
        endLat: trip.endCoords.lat,
        endLng: trip.endCoords.lng,
        distance: trip.distance,
        fuelCost: trip.fuelCost || null,
        allowance: trip.allowance || null,
        accommodation: trip.accommodation || null,
        totalCost: trip.totalCost,
        status: trip.status,
        vehicle: trip.vehicle || null,
    }));
}

/**
 * Format costs for BI
 */
function formatCostsForBI(trips: Trip[]): any[] {
    const costs: any[] = [];

    trips.forEach(trip => {
        if (trip.fuelCost) {
            costs.push({
                tripId: trip.id,
                category: 'fuel',
                amount: trip.fuelCost,
                date: trip.date,
            });
        }

        if (trip.allowance) {
            costs.push({
                tripId: trip.id,
                category: 'allowance',
                amount: trip.allowance,
                date: trip.date,
            });
        }

        if (trip.accommodation) {
            costs.push({
                tripId: trip.id,
                category: 'accommodation',
                amount: trip.accommodation,
                date: trip.date,
            });
        }
    });

    return costs;
}

/**
 * Format analytics for BI
 */
function formatAnalyticsForBI(trips: Trip[]): any[] {
    const byMonth: Record<string, {
        totalTrips: number;
        totalDistance: number;
        totalCost: number;
    }> = {};

    trips.forEach(trip => {
        const date = new Date(trip.date);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!byMonth[period]) {
            byMonth[period] = {
                totalTrips: 0,
                totalDistance: 0,
                totalCost: 0,
            };
        }

        byMonth[period].totalTrips++;
        byMonth[period].totalDistance += trip.distance;
        byMonth[period].totalCost += trip.totalCost;
    });

    return Object.entries(byMonth).map(([period, stats]) => ({
        period,
        totalTrips: stats.totalTrips,
        totalDistance: parseFloat(stats.totalDistance.toFixed(2)),
        totalCost: parseFloat(stats.totalCost.toFixed(2)),
        avgCostPerKm: parseFloat((stats.totalCost / stats.totalDistance).toFixed(2)),
    }));
}

/**
 * Convert to CSV
 */
function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(h => {
            const value = row[h];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
}

/**
 * Create API token for BI access
 */
export interface BIAPIToken {
    token: string;
    name: string;
    permissions: string[]; // dataset names
    expiresAt: Date;
    createdAt: Date;
    lastUsed?: Date;
}

export function generateBIAPIToken(
    name: string,
    permissions: string[],
    expiryDays: number = 365
): BIAPIToken {
    const token = `bi_${Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    return {
        token,
        name,
        permissions,
        expiresAt,
        createdAt: new Date(),
    };
}

/**
 * Validate BI API token
 */
export function validateBIAPIToken(
    token: string,
    storedTokens: BIAPIToken[]
): {
    valid: boolean;
    token?: BIAPIToken;
    error?: string;
} {
    const found = storedTokens.find(t => t.token === token);

    if (!found) {
        return { valid: false, error: 'Invalid token' };
    }

    if (new Date() > found.expiresAt) {
        return { valid: false, error: 'Token expired' };
    }

    return { valid: true, token: found };
}

/**
 * Get dataset metadata
 */
export function getDatasetMetadata(datasetName: string): BIDataset | null {
    return BI_DATASETS[datasetName] || null;
}

/**
 * List all available datasets
 */
export function listAvailableDatasets(): BIDataset[] {
    return Object.values(BI_DATASETS);
}

/**
 * Generate OpenAPI spec for BI API
 */
export function generateBIAPISpec(): any {
    return {
        openapi: '3.0.0',
        info: {
            title: 'GovTrip BI Export API',
            version: '1.0.0',
            description: 'API for exporting trip data to external BI tools',
        },
        servers: [
            {
                url: 'https://api.govtrip.go.th/v1',
                description: 'Production server',
            },
        ],
        paths: {
            '/bi/datasets': {
                get: {
                    summary: 'List available datasets',
                    responses: {
                        '200': {
                            description: 'List of datasets',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/bi/datasets/{dataset}': {
                get: {
                    summary: 'Export dataset',
                    parameters: [
                        {
                            name: 'dataset',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                        {
                            name: 'format',
                            in: 'query',
                            schema: { type: 'string', enum: ['JSON', 'CSV'] },
                        },
                    ],
                    security: [{ BearerAuth: [] }],
                    responses: {
                        '200': {
                            description: 'Dataset data',
                        },
                    },
                },
            },
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                },
            },
        },
    };
}
