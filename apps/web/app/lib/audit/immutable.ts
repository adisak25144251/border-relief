/**
 * Immutable Audit Log Module (WORM - Write Once Read Many)
 * ระบบบันทึกการตรวจสอบที่แก้ไขไม่ได้ สำหรับงานราชการ
 */

import { createHash } from 'crypto';
import type { AuditLogEntry } from './log';

export interface ImmutableAuditRecord extends AuditLogEntry {
    sequenceNumber: number;
    previousHash: string;
    currentHash: string;
    signature?: string; // Digital signature (optional)
}

export interface AuditChain {
    records: ImmutableAuditRecord[];
    isValid: boolean;
    totalRecords: number;
    firstRecordHash: string;
    lastRecordHash: string;
}

/**
 * Calculate hash for audit record
 */
function calculateHash(record: Omit<ImmutableAuditRecord, 'currentHash'>): string {
    const data = JSON.stringify({
        id: record.id,
        timestamp: record.timestamp,
        action: record.action,
        userId: record.userId,
        resource: record.resource,
        details: record.details,
        success: record.success,
        sequenceNumber: record.sequenceNumber,
        previousHash: record.previousHash,
    });

    return createHash('sha256').update(data).digest('hex');
}

/**
 * Create immutable audit record
 */
export function createImmutableRecord(
    entry: AuditLogEntry,
    sequenceNumber: number,
    previousHash: string
): ImmutableAuditRecord {
    const record: Omit<ImmutableAuditRecord, 'currentHash'> = {
        ...entry,
        sequenceNumber,
        previousHash,
    };

    const currentHash = calculateHash(record);

    return {
        ...record,
        currentHash,
    };
}

/**
 * Verify single record integrity
 */
export function verifyRecord(record: ImmutableAuditRecord): boolean {
    const calculatedHash = calculateHash({
        ...record,
        currentHash: '', // Exclude current hash from calculation
    });

    return calculatedHash === record.currentHash;
}

/**
 * Verify entire audit chain
 */
export function verifyAuditChain(records: ImmutableAuditRecord[]): {
    isValid: boolean;
    errors: string[];
    brokenLinks: number[];
} {
    const errors: string[] = [];
    const brokenLinks: number[] = [];

    if (records.length === 0) {
        return { isValid: true, errors: [], brokenLinks: [] };
    }

    // Check sequence numbers
    for (let i = 0; i < records.length; i++) {
        if (records[i].sequenceNumber !== i + 1) {
            errors.push(`Invalid sequence number at position ${i}: expected ${i + 1}, got ${records[i].sequenceNumber}`);
            brokenLinks.push(i);
        }
    }

    // Verify each record's hash
    for (let i = 0; i < records.length; i++) {
        if (!verifyRecord(records[i])) {
            errors.push(`Hash verification failed for record ${i} (${records[i].id})`);
            brokenLinks.push(i);
        }
    }

    // Verify chain links
    for (let i = 1; i < records.length; i++) {
        if (records[i].previousHash !== records[i - 1].currentHash) {
            errors.push(`Chain broken between records ${i - 1} and ${i}`);
            brokenLinks.push(i);
        }
    }

    // Genesis record should have special previous hash
    if (records.length > 0 && records[0].previousHash !== '0'.repeat(64)) {
        errors.push('Genesis record has invalid previous hash');
        brokenLinks.push(0);
    }

    return {
        isValid: errors.length === 0,
        errors,
        brokenLinks: [...new Set(brokenLinks)].sort(),
    };
}

/**
 * Get audit chain summary
 */
export function getAuditChainSummary(records: ImmutableAuditRecord[]): AuditChain {
    const verification = verifyAuditChain(records);

    return {
        records,
        isValid: verification.isValid,
        totalRecords: records.length,
        firstRecordHash: records.length > 0 ? records[0].currentHash : '',
        lastRecordHash: records.length > 0 ? records[records.length - 1].currentHash : '',
    };
}

/**
 * Export audit chain for archival
 */
export function exportAuditChain(records: ImmutableAuditRecord[]): {
    metadata: {
        exportDate: string;
        totalRecords: number;
        firstRecord: string;
        lastRecord: string;
        chainValid: boolean;
    };
    records: ImmutableAuditRecord[];
    verification: ReturnType<typeof verifyAuditChain>;
} {
    const verification = verifyAuditChain(records);

    return {
        metadata: {
            exportDate: new Date().toISOString(),
            totalRecords: records.length,
            firstRecord: records[0]?.id || '',
            lastRecord: records[records.length - 1]?.id || '',
            chainValid: verification.isValid,
        },
        records,
        verification,
    };
}

/**
 * Detect tampering attempts
 */
export function detectTampering(
    records: ImmutableAuditRecord[]
): {
    tampered: boolean;
    suspiciousRecords: Array<{
        index: number;
        recordId: string;
        issues: string[];
    }>;
} {
    const verification = verifyAuditChain(records);
    const suspicious: Array<{ index: number; recordId: string; issues: string[] }> = [];

    if (!verification.isValid) {
        verification.brokenLinks.forEach(index => {
            const issues: string[] = [];
            const errors = verification.errors.filter(e =>
                e.includes(`record ${index}`) || e.includes(`position ${index}`)
            );
            issues.push(...errors);

            suspicious.push({
                index,
                recordId: records[index]?.id || 'UNKNOWN',
                issues,
            });
        });
    }

    return {
        tampered: !verification.isValid,
        suspiciousRecords: suspicious,
    };
}

/**
 * Get genesis hash (for starting a new chain)
 */
export function getGenesisHash(): string {
    return '0'.repeat(64); // 64 zeros
}

/**
 * Create backup checkpoint
 */
export function createCheckpoint(records: ImmutableAuditRecord[]): {
    checkpointHash: string;
    timestamp: Date;
    recordCount: number;
    lastSequence: number;
} {
    const lastRecord = records[records.length - 1];
    const dataToHash = JSON.stringify({
        recordCount: records.length,
        lastHash: lastRecord?.currentHash || '',
        lastSequence: lastRecord?.sequenceNumber || 0,
        timestamp: new Date().toISOString(),
    });

    return {
        checkpointHash: createHash('sha256').update(dataToHash).digest('hex'),
        timestamp: new Date(),
        recordCount: records.length,
        lastSequence: lastRecord?.sequenceNumber || 0,
    };
}
