import type { Trip } from '../utils/zod';

/**
 * PDF Report Generation Module
 * Note: This uses browser's print functionality for PDF generation
 * For server-side PDF generation, consider using pdf-lib or jsPDF with more features
 */

/**
 * Generate HTML for trip report
 */
export function generateTripReportHTML(trip: Trip): string {
    const dateStr = typeof trip.date === 'string' ? trip.date : trip.date.toISOString().split('T')[0];

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานการเดินทางราชการ - ${trip.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 14pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24pt;
      color: #1e40af;
      font-weight: 700;
    }
    .header .trip-id {
      font-size: 16pt;
      color: #64748b;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18pt;
      font-weight: 700;
      color: #1e40af;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      padding: 12px;
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
      font-size: 12pt;
    }
    .info-value {
      font-size: 14pt;
      color: #0f172a;
      margin-top: 4px;
    }
    .cost-breakdown {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .cost-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e1;
    }
    .cost-item:last-child {
      border-bottom: none;
      font-weight: 700;
      font-size: 16pt;
      color: #1e40af;
      padding-top: 12px;
      margin-top: 8px;
      border-top: 2px solid #3b82f6;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13pt;
    }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-verified { background: #dbeafe; color: #1e40af; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 11pt;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>รายงานการเดินทางราชการ</h1>
    <div class="trip-id">เลขที่: ${trip.id}</div>
  </div>

  <div class="section">
    <h2 class="section-title">ข้อมูลทั่วไป</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">ภารกิจ</div>
        <div class="info-value">${trip.title}</div>
      </div>
      <div class="info-item">
        <div class="info-label">วันที่เดินทาง</div>
        <div class="info-value">${dateStr}</div>
      </div>
      <div class="info-item">
        <div class="info-label">พาหนะ</div>
        <div class="info-value">${trip.vehicle || 'ไม่ระบุ'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">สถานะ</div>
        <div class="info-value">
          <span class="status-badge status-${trip.status === 'อนุมัติแล้ว' ? 'approved' : trip.status === 'รออนุมัติ' ? 'pending' : trip.status === 'ตรวจสอบแล้ว' ? 'verified' : 'cancelled'}">
            ${trip.status}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">เส้นทาง</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">จุดเริ่มต้น</div>
        <div class="info-value">${trip.startLocation}</div>
        <div style="font-size: 11pt; color: #64748b; margin-top: 4px;">
          (${trip.startCoords.lat.toFixed(4)}, ${trip.startCoords.lng.toFixed(4)})
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">จุดหมายปลายทาง</div>
        <div class="info-value">${trip.endLocation}</div>
        <div style="font-size: 11pt; color: #64748b; margin-top: 4px;">
          (${trip.endCoords.lat.toFixed(4)}, ${trip.endCoords.lng.toFixed(4)})
        </div>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">ระยะทาง</div>
        <div class="info-value" style="font-size: 20pt; font-weight: 700; color: #1e40af;">
          ${trip.distance.toLocaleString('th-TH')} กิโลเมตร
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">รายละเอียดค่าใช้จ่าย</h2>
    <div class="cost-breakdown">
      ${trip.fuelPrice ? `
      <div class="cost-item">
        <span>น้ำมันเชื้อเพลิง (${trip.fuelPrice} บาท/ลิตร)</span>
        <span>${(trip.fuelCost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
      </div>
      ` : ''}
      ${trip.allowance ? `
      <div class="cost-item">
        <span>ค่าเบี้ยเลี้ยง</span>
        <span>${trip.allowance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
      </div>
      ` : ''}
      ${trip.accommodation ? `
      <div class="cost-item">
        <span>ค่าที่พัก</span>
        <span>${trip.accommodation.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
      </div>
      ` : ''}
      <div class="cost-item">
        <span>รวมทั้งสิ้น</span>
        <span>${trip.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
      </div>
    </div>
    <div style="margin-top: 15px; padding: 12px; background: #f1f5f9; border-radius: 6px; text-align: center;">
      <strong>ค่าใช้จ่ายต่อกิโลเมตร:</strong>
      <span style="font-size: 16pt; color: #1e40af; font-weight: 700; margin-left: 10px;">
        ${(trip.totalCost / trip.distance).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/กม.
      </span>
    </div>
  </div>

  ${trip.risk ? `
  <div class="section">
    <h2 class="section-title">การประเมินความเสี่ยง</h2>
    <div class="info-item">
      <div class="info-label">ระดับความเสี่ยง</div>
      <div class="info-value" style="font-size: 18pt; font-weight: 700; color: ${trip.risk === 'สูง' ? '#dc2626' : trip.risk === 'ปานกลาง' ? '#ea580c' : '#16a34a'}">
        ${trip.risk}
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>ออกรายงานโดยระบบ GovTrip Intelligence</p>
    <p>วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14pt; font-family: 'Sarabun', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    พิมพ์/บันทึก PDF
  </button>
</body>
</html>
  `.trim();
}

/**
 * Generate and print trip report
 */
export function printTripReport(trip: Trip) {
    const html = generateTripReportHTML(trip);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        // Auto-print after loading
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

/**
 * Generate summary report for multiple trips
 */
export function generateSummaryReportHTML(trips: Trip[], title: string = 'สรุปการเดินทางราชการ'): string {
    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const totalCost = trips.reduce((sum, t) => sum + t.totalCost, 0);
    const avgCostPerKm = totalCost / totalDistance;

    const byStatus = trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13pt;
      padding: 30px;
    }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 22pt; color: #1e40af; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-value { font-size: 28pt; font-weight: 700; }
    .stat-label { font-size: 12pt; opacity: 0.9; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 700; color: #1e40af; }
    tr:hover { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>จำนวน ${trips.length} ทริป</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${trips.length}</div>
      <div class="stat-label">ทริปทั้งหมด</div>
    </div>
    <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <div class="stat-value">${totalDistance.toFixed(0)}</div>
      <div class="stat-label">กิโลเมตร</div>
    </div>
    <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
      <div class="stat-value">${(totalCost / 1000).toFixed(0)}K</div>
      <div class="stat-label">บาท</div>
    </div>
    <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
      <div class="stat-value">${avgCostPerKm.toFixed(2)}</div>
      <div class="stat-label">บาท/กม.</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>รหัส</th>
        <th>ภารกิจ</th>
        <th>ระยะทาง (กม.)</th>
        <th>ต้นทุน (บาท)</th>
        <th>สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${trips.map((trip, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${trip.id}</td>
          <td>${trip.title}</td>
          <td>${trip.distance.toFixed(2)}</td>
          <td>${trip.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td>${trip.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">
    พิมพ์ PDF
  </button>
</body>
</html>
  `.trim();
}

/**
 * Print summary report
 */
export function printSummaryReport(trips: Trip[], title?: string) {
    const html = generateSummaryReportHTML(trips, title);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
}
