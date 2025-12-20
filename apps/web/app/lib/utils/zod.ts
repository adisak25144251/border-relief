import { z } from 'zod';

// Common Schemas
export const TripSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'ต้องระบุชื่อภารกิจ'),
    date: z.string().or(z.date()),
    vehicle: z.string().optional(),
    startLocation: z.string().min(1, 'ต้องระบุจุดเริ่มต้น'),
    startCoords: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    endLocation: z.string().min(1, 'ต้องระบุจุดหมาย'),
    endCoords: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    distance: z.number().min(0),
    fuelPrice: z.number().min(0).optional(),
    allowance: z.number().min(0).optional(),
    accommodation: z.number().min(0).optional(),
    totalCost: z.number().min(0),
    status: z.enum(['รออนุมัติ', 'อนุมัติแล้ว', 'ตรวจสอบแล้ว', 'ยกเลิก']),
    risk: z.enum(['ต่ำ', 'ปานกลาง', 'สูง']).optional(),
});

export const GPSPointSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    timestamp: z.string().or(z.date()),
    accuracy: z.number().min(0).optional(),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
});

export const VehicleSchema = z.object({
    id: z.string(),
    name: z.string(),
    licensePlate: z.string(),
    type: z.enum(['sedan', 'suv', 'van', 'truck', 'motorcycle']),
    fuelEfficiency: z.number().min(0), // km/liter
    year: z.number().int().min(1900),
    department: z.string().optional(),
});

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'manager', 'driver', 'auditor']),
    department: z.string().optional(),
});

// Validation helpers
export const validateTrip = (data: unknown) => TripSchema.parse(data);
export const validateGPSPoint = (data: unknown) => GPSPointSchema.parse(data);
export const validateVehicle = (data: unknown) => VehicleSchema.parse(data);
export const validateUser = (data: unknown) => UserSchema.parse(data);

// Safe parse versions
export const safeParseTrip = (data: unknown) => TripSchema.safeParse(data);
export const safeParseGPSPoint = (data: unknown) => GPSPointSchema.safeParse(data);
export const safeParseVehicle = (data: unknown) => VehicleSchema.safeParse(data);
export const safeParseUser = (data: unknown) => UserSchema.safeParse(data);

export type Trip = z.infer<typeof TripSchema>;
export type GPSPoint = z.infer<typeof GPSPointSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
export type User = z.infer<typeof UserSchema>;
