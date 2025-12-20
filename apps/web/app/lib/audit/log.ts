/**
 * Audit Logging Module
 * บันทึกการดำเนินการทั้งหมดในระบบเพื่อการตรวจสอบ
 */

import { generateAuditLogId } from '../utils/id';

export enum AuditAction {
    // Trip actions
    TRIP_CREATE = 'TRIP_CREATE',
    TRIP_UPDATE = 'TRIP_UPDATE',
    TRIP_DELETE = 'TRIP_DELETE',
    TRIP_APPROVE = 'TRIP_APPROVE',
    TRIP_REJECT = 'TRIP_REJECT',
    TRIP_VIEW = 'TRIP_VIEW',
    TRIP_EXPORT = 'TRIP_EXPORT',

    // User actions
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',

    // Data actions
    DATA_IMPORT = 'DATA_IMPORT',
    DATA_EXPORT = 'DATA_EXPORT',
    DATA_DELETE = 'DATA_DELETE',

    // System actions
    SYSTEM_CONFIG = 'SYSTEM_CONFIG',
    SYSTEM_BACKUP = 'SYSTEM_BACKUP',
    SYSTEM_RESTORE = 'SYSTEM_RESTORE',

    // Security actions
    SECURITY_ACCESS_DENIED = 'SECURITY_ACCESS_DENIED',
    SECURITY_ANOMALY = 'SECURITY_ANOMALY',
}

export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    action: AuditAction;
    severity: AuditSeverity;
    userId: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string; // What was accessed (e.g., "Trip T-0001")
    details?: Record<string, any>;
    success: boolean;
    errorMessage?: string;
}

/**
 * Create audit log entry
 */
export function createAuditLog(
    action: AuditAction,
    userId: string,
    options?: {
        severity?: AuditSeverity;
        userRole?: string;
        ipAddress?: string;
        userAgent?: string;
        resource?: string;
        details?: Record<string, any>;
        success?: boolean;
        errorMessage?: string;
    }
): AuditLogEntry {
    return {
        id: generateAuditLogId(),
        timestamp: new Date(),
        action,
        severity: options?.severity || AuditSeverity.INFO,
        userId,
        userRole: options?.userRole,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        resource: options?.resource,
        details: options?.details,
        success: options?.success ?? true,
        errorMessage: options?.errorMessage,
    };
}

/**
 * Log trip action
 */
export function logTripAction(
    action: AuditAction,
    userId: string,
    tripId: string,
    details?: Record<string, any>,
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        userRole?: string;
    }
): AuditLogEntry {
    return createAuditLog(action, userId, {
        resource: `Trip ${tripId}`,
        details,
        ...metadata,
    });
}

/**
 * Log security event
 */
export function logSecurityEvent(
    action: AuditAction,
    userId: string,
    severity: AuditSeverity,
    details: Record<string, any>,
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }
): AuditLogEntry {
    return createAuditLog(action, userId, {
        severity,
        details,
        success: false,
        ...metadata,
    });
}

/**
 * Log export action
 */
export function logExportAction(
    userId: string,
    exportType: string,
    recordCount: number,
    metadata?: {
        ipAddress?: string;
        format?: string;
    }
): AuditLogEntry {
    return createAuditLog(AuditAction.DATA_EXPORT, userId, {
        details: {
            exportType,
            recordCount,
            format: metadata?.format,
        },
        ipAddress: metadata?.ipAddress,
    });
}

/**
 * Format audit log for display
 */
export function formatAuditLog(log: AuditLogEntry): string {
    const timestamp = log.timestamp.toLocaleString('th-TH');
    const status = log.success ? 'SUCCESS' : 'FAILED';

    let message = `[${timestamp}] [${log.severity}] ${log.action} by ${log.userId}`;

    if (log.resource) {
        message += ` on ${log.resource}`;
    }

    message += ` - ${status}`;

    if (log.ipAddress) {
        message += ` (IP: ${log.ipAddress})`;
    }

    if (log.errorMessage) {
        message += ` Error: ${log.errorMessage}`;
    }

    return message;
}

/**
 * Search audit logs
 */
export interface AuditLogFilter {
    userId?: string;
    action?: AuditAction;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    resource?: string;
}

export function filterAuditLogs(logs: AuditLogEntry[], filter: AuditLogFilter): AuditLogEntry[] {
    return logs.filter(log => {
        if (filter.userId && log.userId !== filter.userId) return false;
        if (filter.action && log.action !== filter.action) return false;
        if (filter.severity && log.severity !== filter.severity) return false;
        if (filter.success !== undefined && log.success !== filter.success) return false;
        if (filter.resource && !log.resource?.includes(filter.resource)) return false;

        if (filter.startDate && log.timestamp < filter.startDate) return false;
        if (filter.endDate && log.timestamp > filter.endDate) return false;

        return true;
    });
}

/**
 * Generate audit report
 */
export interface AuditReport {
    totalLogs: number;
    byAction: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
    failureRate: number;
    period: { start: Date; end: Date };
}

export function generateAuditReport(logs: AuditLogEntry[], startDate: Date, endDate: Date): AuditReport {
    const filteredLogs = logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);

    const byAction: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    let failures = 0;

    filteredLogs.forEach(log => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
        if (!log.success) failures++;
    });

    return {
        totalLogs: filteredLogs.length,
        byAction,
        bySeverity,
        byUser,
        failureRate: filteredLogs.length > 0 ? (failures / filteredLogs.length) * 100 : 0,
        period: { start: startDate, end: endDate },
    };
}
