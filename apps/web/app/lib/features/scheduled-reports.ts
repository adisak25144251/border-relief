/**
 * Scheduled Report Module
 * ส่งออกรายงานอัตโนมัติรายวัน/รายเดือน
 */

import type { Trip } from '../utils/zod';

export interface ScheduledReport {
    id: string;
    name: string;
    description?: string;
    schedule: {
        type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
        time: string; // HH:MM format
        dayOfWeek?: number; // 0-6 for weekly
        dayOfMonth?: number; // 1-31 for monthly
        enabled: boolean;
    };
    format: 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
    recipients: Array<{
        email: string;
        name: string;
        role: string;
    }>;
    filters: {
        status?: string[];
        department?: string[];
        dateRange?: 'LAST_DAY' | 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_QUARTER';
    };
    includeCharts: boolean;
    includeAnalytics: boolean;
    createdBy: string;
    createdAt: Date;
    lastRun?: Date;
    nextRun?: Date;
}

export interface ReportExecution {
    id: string;
    reportId: string;
    executedAt: Date;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    recordCount: number;
    fileSize?: number; // bytes
    downloadUrl?: string;
    error?: string;
}

/**
 * Calculate next run time
 */
export function calculateNextRun(schedule: ScheduledReport['schedule'], fromDate: Date = new Date()): Date {
    const next = new Date(fromDate);
    const [hours, minutes] = schedule.time.split(':').map(Number);

    switch (schedule.type) {
        case 'DAILY':
            next.setDate(next.getDate() + 1);
            next.setHours(hours, minutes, 0, 0);
            break;

        case 'WEEKLY':
            if (schedule.dayOfWeek !== undefined) {
                const currentDay = next.getDay();
                let daysToAdd = schedule.dayOfWeek - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                next.setDate(next.getDate() + daysToAdd);
                next.setHours(hours, minutes, 0, 0);
            }
            break;

        case 'MONTHLY':
            if (schedule.dayOfMonth !== undefined) {
                next.setMonth(next.getMonth() + 1);
                next.setDate(Math.min(schedule.dayOfMonth, 31));
                next.setHours(hours, minutes, 0, 0);
            }
            break;

        case 'QUARTERLY':
            next.setMonth(next.getMonth() + 3);
            if (schedule.dayOfMonth !== undefined) {
                next.setDate(Math.min(schedule.dayOfMonth, 31));
            }
            next.setHours(hours, minutes, 0, 0);
            break;
    }

    return next;
}

/**
 * Check if report should run now
 */
export function shouldRunNow(report: ScheduledReport, currentTime: Date = new Date()): boolean {
    if (!report.schedule.enabled) return false;
    if (!report.nextRun) return false;

    // Check if current time is past next run time
    const diff = currentTime.getTime() - report.nextRun.getTime();

    // Allow 5 minute window
    return diff >= 0 && diff < 5 * 60 * 1000;
}

/**
 * Execute scheduled report
 */
export async function executeScheduledReport(
    report: ScheduledReport,
    trips: Trip[]
): Promise<ReportExecution> {
    const execution: ReportExecution = {
        id: `EXEC-${Date.now()}`,
        reportId: report.id,
        executedAt: new Date(),
        status: 'PENDING',
        recordCount: 0,
    };

    try {
        // Apply filters
        let filteredTrips = [...trips];

        if (report.filters.status && report.filters.status.length > 0) {
            filteredTrips = filteredTrips.filter(t => report.filters.status!.includes(t.status));
        }

        if (report.filters.dateRange) {
            const now = new Date();
            let startDate = new Date();

            switch (report.filters.dateRange) {
                case 'LAST_DAY':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'LAST_WEEK':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'LAST_MONTH':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'LAST_QUARTER':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
            }

            filteredTrips = filteredTrips.filter(t => {
                const tripDate = new Date(t.date);
                return tripDate >= startDate && tripDate <= now;
            });
        }

        execution.recordCount = filteredTrips.length;

        // Generate report (simplified - would call export modules)
        const reportData = generateReportData(filteredTrips, report);

        // Simulated file size
        execution.fileSize = JSON.stringify(reportData).length;
        execution.downloadUrl = `/api/reports/download/${execution.id}`;
        execution.status = 'SUCCESS';

    } catch (error: any) {
        execution.status = 'FAILED';
        execution.error = error.message;
    }

    return execution;
}

/**
 * Generate report data
 */
function generateReportData(
    trips: Trip[],
    report: ScheduledReport
): any {
    const summary = {
        totalTrips: trips.length,
        totalDistance: trips.reduce((sum, t) => sum + t.distance, 0),
        totalCost: trips.reduce((sum, t) => sum + t.totalCost, 0),
        averageCostPerKm: 0,
    };

    summary.averageCostPerKm = summary.totalCost / summary.totalDistance;

    const byStatus = trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        reportName: report.name,
        generatedAt: new Date().toISOString(),
        period: report.filters.dateRange,
        summary,
        byStatus,
        trips: report.format === 'JSON' ? trips : trips.length,
    };
}

/**
 * Get delivery status
 */
export interface DeliveryStatus {
    recipient: string;
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
    sentAt?: Date;
    deliveredAt?: Date;
    error?: string;
}

export function getDeliveryStatuses(execution: ReportExecution, report: ScheduledReport): DeliveryStatus[] {
    // In production, would check email service
    return report.recipients.map(recipient => ({
        recipient: recipient.email,
        status: 'DELIVERED' as const,
        sentAt: execution.executedAt,
        deliveredAt: new Date(execution.executedAt.getTime() + 30000), // +30s simulated
    }));
}

/**
 * Get execution history
 */
export function getExecutionHistory(
    executions: ReportExecution[],
    reportId: string,
    limit: number = 10
): ReportExecution[] {
    return executions
        .filter(e => e.reportId === reportId)
        .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
        .slice(0, limit);
}

/**
 * Get execution statistics
 */
export function getExecutionStatistics(executions: ReportExecution[]): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    averageRecordCount: number;
    averageFileSize: number;
} {
    const successful = executions.filter(e => e.status === 'SUCCESS').length;
    const failed = executions.filter(e => e.status === 'FAILED').length;

    const avgRecordCount = executions.reduce((sum, e) => sum + e.recordCount, 0) / executions.length;
    const avgFileSize = executions
        .filter(e => e.fileSize)
        .reduce((sum, e) => sum + (e.fileSize || 0), 0) / executions.filter(e => e.fileSize).length;

    return {
        total: executions.length,
        successful,
        failed,
        successRate: (successful / executions.length) * 100,
        averageRecordCount: parseFloat(avgRecordCount.toFixed(2)),
        averageFileSize: parseFloat(avgFileSize.toFixed(2)),
    };
}

/**
 * Common report templates
 */
export const REPORT_TEMPLATES = {
    DAILY_SUMMARY: {
        name: 'สรุปรายวัน',
        schedule: {
            type: 'DAILY' as const,
            time: '08:00',
            enabled: true,
        },
        format: 'PDF' as const,
        filters: {
            dateRange: 'LAST_DAY' as const,
        },
        includeCharts: true,
        includeAnalytics: false,
    },

    WEEKLY_REPORT: {
        name: 'รายงานสัปดาห์',
        schedule: {
            type: 'WEEKLY' as const,
            time: '09:00',
            dayOfWeek: 1, // Monday
            enabled: true,
        },
        format: 'EXCEL' as const,
        filters: {
            dateRange: 'LAST_WEEK' as const,
        },
        includeCharts: true,
        includeAnalytics: true,
    },

    MONTHLY_ANALYTICS: {
        name: 'วิเคราะห์รายเดือน',
        schedule: {
            type: 'MONTHLY' as const,
            time: '10:00',
            dayOfMonth: 1,
            enabled: true,
        },
        format: 'PDF' as const,
        filters: {
            dateRange: 'LAST_MONTH' as const,
        },
        includeCharts: true,
        includeAnalytics: true,
    },
} as const;

/**
 * Create report from template
 */
export function createReportFromTemplate(
    templateKey: keyof typeof REPORT_TEMPLATES,
    recipients: ScheduledReport['recipients'],
    createdBy: string
): ScheduledReport {
    const template = REPORT_TEMPLATES[templateKey];

    return {
        id: `RPT-${Date.now()}`,
        ...template,
        recipients,
        createdBy,
        createdAt: new Date(),
        nextRun: calculateNextRun(template.schedule),
    };
}
