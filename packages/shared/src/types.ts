// Shared TypeScript Types for GovTrip Intelligence
// Used across frontend and backend

export type TripStatus = 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ตรวจสอบแล้ว' | 'ยกเลิก';
export type RiskLevel = 'ต่ำ' | 'ปานกลาง' | 'สูง';
export type UserRole = 'admin' | 'manager' | 'driver' | 'auditor';
export type VehicleType = 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Trip {
    id: string;
    tripNumber?: string;
    title: string;
    date: string | Date;
    vehicle?: string;

    startLocation: string;
    startCoords: Coordinates;

    endLocation: string;
    endCoords: Coordinates;

    distance: number;

    // Costs
    fuelPrice?: number;
    fuelCost?: number;
    allowance?: number;
    accommodation?: number;
    totalCost: number;

    // Status
    status: TripStatus;
    risk?: RiskLevel;

    // Metadata
    driverId?: string;
    vehicleId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GPSPoint {
    lat: number;
    lng: number;
    timestamp: string | Date;
    accuracy?: number;
    speed?: number;
    heading?: number;
}

export interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
    type: VehicleType;
    fuelEfficiency: number; // km/liter
    year: number;
    department?: string;
    active?: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
    phoneNumber?: string;
}

export interface CostBreakdown {
    fuelCost: number;
    allowance: number;
    accommodation: number;
    depreciation: number;
    wearAndTear: number;
    total: number;
}

export interface CO2Emission {
    distance: number;
    fuelConsumed: number;
    co2Kg: number;
    co2Tons: number;
    treesNeeded: number;
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date | string;
    action: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    userId: string;
    resource?: string;
    details?: Record<string, any>;
    success: boolean;
    errorMessage?: string;
}

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
    };
}

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
    status?: TripStatus;
    startDate?: string;
    endDate?: string;
    driverId?: string;
    vehicleId?: string;
    search?: string;
}
