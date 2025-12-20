import Papa from 'papaparse';
import { validateTrip } from '../utils/zod';
import type { Trip } from '../utils/zod';

interface CSVTripRow {
    mission?: string;
    date?: string;
    vehicle?: string;
    start_location?: string;
    start_lat?: string;
    start_lng?: string;
    end_location?: string;
    end_lat?: string;
    end_lng?: string;
    distance?: string;
    fuel_price?: string;
    allowance?: string;
    accommodation?: string;
    total_cost?: string;
    status?: string;
}

/**
 * Import trips from CSV file
 */
export async function importTripsFromCSV(file: File): Promise<Trip[]> {
    return new Promise((resolve, reject) => {
        Papa.parse<CSVTripRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const trips: Trip[] = results.data.map((row, index) => {
                        const trip = {
                            id: `T-${(index + 1).toString().padStart(4, '0')}`,
                            title: row.mission || `ภารกิจจาก CSV บรรทัด ${index + 1}`,
                            date: row.date || new Date().toISOString().split('T')[0],
                            vehicle: row.vehicle,
                            startLocation: row.start_location || '',
                            startCoords: {
                                lat: parseFloat(row.start_lat || '0'),
                                lng: parseFloat(row.start_lng || '0'),
                            },
                            endLocation: row.end_location || '',
                            endCoords: {
                                lat: parseFloat(row.end_lat || '0'),
                                lng: parseFloat(row.end_lng || '0'),
                            },
                            distance: parseFloat(row.distance || '0'),
                            fuelPrice: row.fuel_price ? parseFloat(row.fuel_price) : undefined,
                            allowance: row.allowance ? parseFloat(row.allowance) : undefined,
                            accommodation: row.accommodation ? parseFloat(row.accommodation) : undefined,
                            totalCost: parseFloat(row.total_cost || '0'),
                            status: (row.status as any) || 'รออนุมัติ',
                        };

                        return validateTrip(trip);
                    });

                    resolve(trips);
                } catch (error) {
                    reject(new Error(`CSV validation failed: ${error}`));
                }
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            },
        });
    });
}

/**
 * Export template CSV for trips
 */
export function getCSVTemplate(): string {
    const headers = [
        'mission',
        'date',
        'vehicle',
        'start_location',
        'start_lat',
        'start_lng',
        'end_location',
        'end_lat',
        'end_lng',
        'distance',
        'fuel_price',
        'allowance',
        'accommodation',
        'total_cost',
        'status',
    ];

    const example = {
        mission: 'ตรวจราชการ จ.อยุธยา',
        date: '2025-01-15',
        vehicle: 'Toyota Fortuner (กข-1234)',
        start_location: 'กรุงเทพมหานคร',
        start_lat: '13.7563',
        start_lng: '100.5018',
        end_location: 'จังหวัดพระนครศรีอยุธยา',
        end_lat: '14.3692',
        end_lng: '100.5877',
        distance: '85.5',
        fuel_price: '35.50',
        allowance: '500',
        accommodation: '1200',
        total_cost: '2450',
        status: 'รออนุมัติ',
    };

    return Papa.unparse([headers, Object.values(example)]);
}

/**
 * Validate CSV structure
 */
export function validateCSVStructure(file: File): Promise<{ valid: boolean; errors: string[] }> {
    return new Promise((resolve) => {
        const errors: string[] = [];
        const requiredColumns = ['mission', 'start_location', 'end_location'];

        Papa.parse(file, {
            header: true,
            preview: 1,
            complete: (results) => {
                const columns = results.meta.fields || [];

                requiredColumns.forEach((col) => {
                    if (!columns.includes(col)) {
                        errors.push(`Missing required column: ${col}`);
                    }
                });

                resolve({
                    valid: errors.length === 0,
                    errors,
                });
            },
        });
    });
}
