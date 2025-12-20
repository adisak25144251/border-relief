# Data Quality Specifications - GovTrip Intelligence

## Overview
การรับประกันคุณภาพข้อมูลเป็นหัวใจสำคัญของระบบ GovTrip Intelligence  
เอกสารนี้กำหนดมาตรฐานคุณภาพข้อมูลและกระบวนการตรวจสอบ

## GPS Data Quality

### Accuracy Requirements
| Level | Accuracy | Use Case |
|-------|----------|----------|
| ⭐⭐⭐ Excellent | < 10 เมตร | Route tracking, verification |
| ⭐⭐ Good | 10-30 เมตร | Distance calculation, general tracking |
| ⭐ Acceptable | 30-50 เมตร | Basic location logging |
| ❌ Unacceptable | > 50 เมตร | Rejected, manual review required |

### Data Validation Rules

#### 1. Coordinate Validation
```typescript
// Latitude: -90 to 90
// Longitude: -180 to 180
// Thailand bounds: 
//   Lat: 5.6 - 20.5
//   Lng: 97.3 - 105.6

function validateCoordinates(lat: number, lng: number): boolean {
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  
  // Thailand bounds check (warning, not error)
  if (lat < 5.6 || lat > 20.5 || lng < 97.3 || lng > 105.6) {
    console.warn('Coordinates outside Thailand');
  }
  
  return true;
}
```

#### 2. Timestamp Validation
- Must be within last 365 days (configurable)
- Cannot be in the future
- GPS points must be in chronological order
- Minimum interval between points: 1 second

#### 3. Speed Validation
```typescript
// Maximum reasonable speeds (km/h)
const MAX_SPEEDS = {
  SEDAN: 140,
  SUV: 130,
  VAN: 120,
  TRUCK: 100,
  MOTORCYCLE: 120,
  GENERAL: 150, // Safety limit for all vehicles
};

// Flag speeds > 180 km/h as critical anomalies
```

#### 4. Distance Validation
```typescript
// Distance should be within 120%-250% of straight-line distance
function validateDistance(
  reported: number,
  start: Coords,
  end: Coords
): { valid: boolean; warning?: string } {
  const straightLine = calculateStraightLine(start, end);
  const minExpected = straightLine * 1.2;
  const maxExpected = straightLine * 2.5;
  
  if (reported < minExpected) {
    return {
      valid: false,
      warning: `Distance too low (${reported} < ${minExpected})`
    };
  }
  
  if (reported > maxExpected * 1.5) {
    return {
      valid: false,
      warning: `Distance suspiciously high (${reported} > ${maxExpected * 1.5})`
    };
  }
  
  return { valid: true };
}
```

## Trip Data Quality

### Required Fields
✅ **Must Have**:
- Trip ID (format: T-XXXX)
- Title/Mission name
- Date (ISO 8601 format)
- Start location (name + coordinates)
- End location (name + coordinates)
- Distance (km, > 0)
- Total cost (THB, >= 0)
- Status (enum)

⚠️ **Should Have**:
- Vehicle information
- Driver ID
- Fuel price
- GPS track points (for verification)

### Data Consistency Checks

#### Cost Validation
```typescript
// Fuel cost should match distance * efficiency * price
function validateFuelCost(trip: Trip): boolean {
  if (!trip.fuelPrice || !trip.vehicle) return true; // Skip if data missing
  
  const expected = (trip.distance / trip.vehicle.efficiency) * trip.fuelPrice;
  const tolerance = 0.15; // 15% tolerance
  
  if (trip.fuelCost) {
    const diff = Math.abs(trip.fuelCost - expected) / expected;
    if (diff > tolerance) {
      console.warn(`Fuel cost mismatch: ${trip.fuelCost} vs ${expected}`);
      return false;
    }
  }
  
  return true;
}
```

#### Status Workflow
```
รออนุมัติ → อนุมัติแล้ว → ตรวจสอบแล้ว
                    ↓
                ยกเลิก (from any state)
```

Invalid transitions will be rejected.

## Data Quality Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| GPS Accuracy Rate | > 95% | % of points with accuracy < 50m |
| Data Completeness | > 98% | % of required fields filled |
| Validation Pass Rate | > 90% | % of trips passing all validations |
| Anomaly Detection Rate | < 10% | % of trips flagged as anomalous |
| Duplicate Rate | < 1% | % of duplicate trips |

### Quality Score Calculation
```typescript
function calculateQualityScore(trip: Trip, gps: GPSPoint[]): number {
  let score = 100;
  
  // GPS accuracy (30 points)
  const avgAccuracy = gps.reduce((sum, p) => sum + (p.accuracy || 50), 0) / gps.length;
  if (avgAccuracy > 50) score -= 30;
  else if (avgAccuracy > 30) score -= 15;
  else if (avgAccuracy > 10) score -= 5;
  
  // Data completeness (30 points)
  const fields = ['vehicle', 'fuelPrice', 'allowance'];
  const missing = fields.filter(f => !trip[f]).length;
  score -= missing * 10;
  
  // Validation (20 points)
  const validations = [
    validateDistance(trip),
    validateFuelCost(trip),
    validateCoordinates(trip.startCoords),
    validateCoordinates(trip.endCoords),
  ];
  const failures = validations.filter(v => !v.valid).length;
  score -= failures * 5;
  
  // Anomalies (20 points)
  const anomalies = detectAllAnomalies(trip);
  score -= anomalies.length * 10;
  
  return Math.max(0, Math.min(100, score));
}
```

## Data Cleansing Procedures

### 1. Duplicate Detection
```sql
-- Find duplicate trips (same date, start, end)
SELECT t1.id, t2.id
FROM trips t1
JOIN trips t2 ON 
  t1.date = t2.date AND
  t1.start_location = t2.start_location AND
  t1.end_location = t2.end_location AND
  t1.id < t2.id
```

### 2. GPS Smoothing
```typescript
// Remove GPS outliers using median filter
function smoothGPSTrack(points: GPSPoint[], windowSize: number = 3): GPSPoint[] {
  if (points.length < windowSize) return points;
  
  const smoothed: GPSPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(points.length, i + halfWindow + 1);
    const window = points.slice(start, end);
    
    // Calculate median lat/lng
    const lats = window.map(p => p.lat).sort((a, b) => a - b);
    const lngs = window.map(p => p.lng).sort((a, b) => a - b);
    
    smoothed.push({
      ...points[i],
      lat: lats[Math.floor(lats.length / 2)],
      lng: lngs[Math.floor(lngs.length / 2)],
    });
  }
  
  return smoothed;
}
```

### 3. Missing Data Imputation
```typescript
// Fill missing fuel prices with recent average
function imputeFuelPrice(trips: Trip[]): Trip[] {
  const recentTrips = trips
    .filter(t => t.fuelPrice)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  
  const avgPrice = recentTrips.reduce((sum, t) => sum + t.fuelPrice!, 0) / recentTrips.length;
  
  return trips.map(trip => ({
    ...trip,
    fuelPrice: trip.fuelPrice || avgPrice,
  }));
}
```

## Data Quality Monitoring

### Daily Checks
- [ ] GPS accuracy distribution
- [ ] Validation failure rate
- [ ] Anomaly detection rate
- [ ] Data completeness percentage

### Weekly Reviews
- [ ] Quality score trends
- [ ] Top data quality issues
- [ ] Cleansing effectiveness
- [ ] User feedback on data quality

### Monthly Reports
- [ ] Comprehensive quality metrics
- [ ] Improvement recommendations
- [ ] System accuracy calibration
- [ ] Training needs assessment

## Quality Assurance Process

### Import Validation
1. **Pre-import checks**
   - File format validation
   - Schema compliance
   - Required fields present

2. **Data validation**
   - Run all validation rules
   - Generate quality report
   - Flag issues for review

3. **Quality gate**
   - > 80% quality score → Auto-approve
   - 60-80% → Manual review required
   - < 60% → Reject with detailed errors

### Post-import Monitoring
- Automated anomaly detection
- Quality score tracking
- Alert on degradation
- Quarterly data audits

## Tools & Scripts

### Quality Dashboard
```
/api/data-quality/dashboard
- Real-time quality metrics
- Quality score distribution
- Top issues list
- Trend charts
```

### Validation API
```
POST /api/validate/trip
- Validates single trip
- Returns quality score
- Lists all issues
- Suggests corrections
```

### Batch Cleansing
```
POST /api/cleanse/batch
- Runs all cleansing procedures
- Generates cleansing report
- Backs up original data
- Logs all changes
```

## References
- ISO 8000 (Data Quality)
- ISO 19157 (Geographic Information - Data Quality)
- Government Data Quality Framework
- GPS Accuracy Standards (WAAS, EGNOS)

---

**Last Updated**: 2025-01-21  
**Version**: 1.0  
**Owner**: Data Quality Team
