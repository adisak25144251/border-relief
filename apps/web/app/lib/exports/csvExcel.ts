import Papa from 'papaparse';
import type { Trip } from '../utils/zod';

/**
 * Export trips to CSV format
 */
export function exportTripsToCSV(trips: Trip[]): string {
    const data = trips.map(trip => ({
        'รหัสทริป': trip.id,
        'ภารกิจ': trip.title,
        'วันที่': typeof trip.date === 'string' ? trip.date : trip.date.toISOString().split('T')[0],
        'พาหนะ': trip.vehicle || '-',
        'จุดเริ่มต้น': trip.startLocation,
        'พิกัดเริ่มต้น (Lat)': trip.startCoords.lat,
        'พิกัดเริ่มต้น (Lng)': trip.startCoords.lng,
        'จุดหมาย': trip.endLocation,
        'พิกัดหมาย (Lat)': trip.endCoords.lat,
        'พิกัดหมาย (Lng)': trip.endCoords.lng,
        'ระยะทาง (กม.)': trip.distance,
        'ราคาน้ำมัน (บาท/ลิตร)': trip.fuelPrice || '-',
        'ค่าเบี้ยเลี้ยง (บาท)': trip.allowance || '-',
        'ค่าที่พัก (บาท)': trip.accommodation || '-',
        'ต้นทุนรวม (บาท)': trip.totalCost,
        'สถานะ': trip.status,
        'ระดับความเสี่ยง': trip.risk || '-',
    }));

    return Papa.unparse(data, {
        quotes: true,
        header: true,
    });
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string = 'trips-export.csv') {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export trips summary table to CSV
 */
export function exportTripsSummary(trips: Trip[]): string {
    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const totalCost = trips.reduce((sum, t) => sum + t.totalCost, 0);
    const avgDistance = totalDistance / trips.length;
    const avgCost = totalCost / trips.length;

    const summary = [
        ['สรุปข้อมูลการเดินทาง', ''],
        ['จำนวนทริปทั้งหมด', trips.length],
        ['ระยะทางรวม (กม.)', totalDistance.toFixed(2)],
        ['ต้นทุนรวม (บาท)', totalCost.toFixed(2)],
        ['ระยะทางเฉลี่ย (กม./ทริป)', avgDistance.toFixed(2)],
        ['ต้นทุนเฉลี่ย (บาท/ทริป)', avgCost.toFixed(2)],
        ['', ''],
        ['รายละเอียดแต่ละทริป', ''],
    ];

    const detailsCSV = exportTripsToCSV(trips);
    const detailsRows = Papa.parse(detailsCSV, { header: false }).data as string[][];

    return Papa.unparse([...summary, ...detailsRows]);
}

/**
 * Create Excel-compatible CSV with formatting hints
 */
export function exportToExcelCSV(trips: Trip[]): string {
    // Add Excel formula columns
    const data = trips.map((trip, index) => ({
        '#': index + 1,
        'รหัส': trip.id,
        'ภารกิจ': trip.title,
        'วันที่': typeof trip.date === 'string' ? trip.date : trip.date.toISOString().split('T')[0],
        'จุดเริ่มต้น': trip.startLocation,
        'จุดหมาย': trip.endLocation,
        'ระยะทาง': trip.distance,
        'ต้นทุน': trip.totalCost,
        'บาท/กม.': `=H${index + 2}/G${index + 2}`, // Formula for cost per km
        'สถานะ': trip.status,
    }));

    return Papa.unparse(data, {
        quotes: true,
        header: true,
    });
}

/**
 * Export filtered and sorted trips
 */
export interface ExportOptions {
    sortBy?: 'date' | 'distance' | 'cost' | 'status';
    sortOrder?: 'asc' | 'desc';
    filterStatus?: string[];
    includeGPS?: boolean;
}

export function exportTripsWithOptions(trips: Trip[], options: ExportOptions = {}): string {
    let filtered = [...trips];

    // Filter
    if (options.filterStatus && options.filterStatus.length > 0) {
        filtered = filtered.filter(t => options.filterStatus!.includes(t.status));
    }

    // Sort
    if (options.sortBy) {
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (options.sortBy) {
                case 'date':
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    comparison = dateA.getTime() - dateB.getTime();
                    break;
                case 'distance':
                    comparison = a.distance - b.distance;
                    break;
                case 'cost':
                    comparison = a.totalCost - b.totalCost;
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status, 'th');
                    break;
            }
            return options.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    return exportTripsToCSV(filtered);
}
