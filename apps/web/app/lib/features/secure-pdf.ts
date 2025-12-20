/**
 * Secure PDF Module with Watermark & QR Verification
 * Export PDF มีลายน้ำ + QR Verify ป้องกันเอกสารปลอม
 */

import { generateDocumentId } from '../utils/id';
import { createHash } from 'crypto';

export interface SecurePDFOptions {
    watermark: {
        text: string;
        opacity: number; // 0-1
        position: 'diagonal' | 'footer' | 'header';
        color: string;
    };
    qrCode: {
        enabled: boolean;
        position: 'top-right' | 'bottom-right' | 'footer';
        size: number; // pixels
        includeHash: boolean;
    };
    security: {
        documentId: string;
        timestamp: Date;
        issuer: string;
        expiryDate?: Date;
    };
}

export interface PDFVerification {
    documentId: string;
    issueDate: Date;
    issuer: string;
    contentHash: string;
    qrCodeData: string;
    verificationUrl: string;
}

/**
 * Generate secure PDF metadata
 */
export function generateSecurePDFMetadata(
    content: string,
    issuer: string,
    options?: {
        expiryDays?: number;
    }
): PDFVerification {
    const documentId = generateDocumentId();
    const issueDate = new Date();

    // Calculate content hash
    const contentHash = createHash('sha256')
        .update(content)
        .update(documentId)
        .update(issueDate.toISOString())
        .digest('hex');

    // Generate QR code data (JSON)
    const qrData = {
        id: documentId,
        issued: issueDate.toISOString(),
        issuer,
        hash: contentHash.slice(0, 16), // First 16 chars
    };

    const qrCodeData = JSON.stringify(qrData);
    const verificationUrl = `https://govtrip.go.th/verify/${documentId}`;

    return {
        documentId,
        issueDate,
        issuer,
        contentHash,
        qrCodeData,
        verificationUrl,
    };
}

/**
 * Verify PDF authenticity
 */
export function verifyPDFDocument(
    documentId: string,
    providedHash: string,
    storedHash: string
): {
    valid: boolean;
    status: 'VALID' | 'INVALID' | 'EXPIRED' | 'NOT_FOUND';
    message: string;
    verifiedAt: Date;
} {
    const verifiedAt = new Date();

    // Check if document exists (would query database)
    // For now, simplified verification

    if (providedHash === storedHash) {
        return {
            valid: true,
            status: 'VALID',
            message: 'เอกสารถูกต้องและยังไม่หมดอายุ',
            verifiedAt,
        };
    }

    return {
        valid: false,
        status: 'INVALID',
        message: 'เอกสารอาจถูกแก้ไขหรือปลอมแปลง',
        verifiedAt,
    };
}

/**
 * Generate watermark HTML/CSS for PDF
 */
export function generateWatermarkHTML(options: SecurePDFOptions['watermark']): string {
    const styles = `
    .watermark {
      position: fixed;
      ${options.position === 'diagonal' ? `
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72pt;
      ` : options.position === 'footer' ? `
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12pt;
      ` : `
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12pt;
      `}
      color: ${options.color};
      opacity: ${options.opacity};
      font-family: 'Sarabun', sans-serif;
      font-weight: 700;
      pointer-events: none;
      z-index: 9999;
      white-space: nowrap;
    }
  `;

    return `
    <style>${styles}</style>
    <div class="watermark">${options.text}</div>
  `;
}

/**
 * Generate QR code HTML for PDF
 */
export function generateQRCodeHTML(
    verificationUrl: string,
    options: SecurePDFOptions['qrCode']
): string {
    if (!options.enabled) return '';

    const position =
        options.position === 'top-right' ? 'top: 20px; right: 20px;' :
            options.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' :
                'bottom: 20px; left: 50%; transform: translateX(-50%);';

    // Use Google Charts API for QR code
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${options.size}x${options.size}&chl=${encodeURIComponent(verificationUrl)}`;

    return `
    <style>
      .qr-code {
        position: fixed;
        ${position}
        padding: 10px;
        background: white;
        border: 2px solid #1e40af;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .qr-label {
        text-align: center;
        font-size: 9pt;
        color: #1e40af;
        margin-top: 5px;
        font-family: 'Sarabun', sans-serif;
      }
    </style>
    <div class="qr-code">
      <img src="${qrUrl}" width="${options.size}" height="${options.size}" alt="QR Code" />
      <div class="qr-label">สแกนเพื่อตรวจสอบ</div>
    </div>
  `;
}

/**
 * Generate complete secure PDF HTML
 */
export function generateSecurePDFHTML(
    originalHTML: string,
    verification: PDFVerification,
    options: SecurePDFOptions
): string {
    const watermarkHTML = generateWatermarkHTML(options.watermark);
    const qrCodeHTML = generateQRCodeHTML(verification.verificationUrl, options.qrCode);

    // Add security footer
    const securityFooter = `
    <style>
      .security-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 10px 20px;
        background: #f8fafc;
        border-top: 2px solid #e2e8f0;
        font-size: 9pt;
        font-family: 'Sarabun', sans-serif;
        color: #64748b;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      @media print {
        .security-footer { position: fixed; bottom: 0; }
      }
    </style>
    <div class="security-footer">
      <span>เลขที่เอกสาร: ${verification.documentId}</span>
      <span>ออกโดย: ${options.security.issuer}</span>
      <span>วันที่: ${verification.issueDate.toLocaleDateString('th-TH')}</span>
      <span>Hash: ${verification.contentHash.slice(0, 12)}...</span>
    </div>
  `;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="document-id" content="${verification.documentId}">
  <meta name="document-hash" content="${verification.contentHash}">
  <meta name="issuer" content="${options.security.issuer}">
  <meta name="issue-date" content="${verification.issueDate.toISOString()}">
  <title>Secure Document - ${verification.documentId}</title>
</head>
<body>
  ${watermarkHTML}
  ${qrCodeHTML}
  ${originalHTML}
  ${securityFooter}
</body>
</html>
  `.trim();
}

/**
 * Create default secure PDF options
 */
export function createDefaultSecurePDFOptions(issuer: string): SecurePDFOptions {
    return {
        watermark: {
            text: 'เอกสารราชการ - ห้ามทำซ้ำ',
            opacity: 0.1,
            position: 'diagonal',
            color: '#1e40af',
        },
        qrCode: {
            enabled: true,
            position: 'bottom-right',
            size: 120,
            includeHash: true,
        },
        security: {
            documentId: generateDocumentId(),
            timestamp: new Date(),
            issuer,
        },
    };
}

/**
 * Batch verify multiple documents
 */
export async function batchVerifyDocuments(
    documents: Array<{ id: string; hash: string }>
): Promise<Array<{
    id: string;
    valid: boolean;
    status: string;
}>> {
    // In production, this would query database for stored hashes
    return documents.map(doc => ({
        id: doc.id,
        valid: false, // Would check against DB
        status: 'PENDING_VERIFICATION',
    }));
}

/**
 * Generate audit trail for document
 */
export interface DocumentAuditEntry {
    timestamp: Date;
    action: 'CREATED' | 'VIEWED' | 'PRINTED' | 'VERIFIED' | 'SHARED';
    userId: string;
    ipAddress?: string;
    result: 'SUCCESS' | 'FAILED';
    details?: any;
}

export function createDocumentAudit(
    documentId: string,
    action: DocumentAuditEntry['action'],
    userId: string,
    options?: {
        ipAddress?: string;
        details?: any;
    }
): DocumentAuditEntry {
    return {
        timestamp: new Date(),
        action,
        userId,
        ipAddress: options?.ipAddress,
        result: 'SUCCESS',
        details: {
            documentId,
            ...options?.details,
        },
    };
}
