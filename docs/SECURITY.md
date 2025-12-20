# Security Guidelines - GovTrip Intelligence

## Overview
คู่มือความปลอดภัยและการปฏิบัติตามกฎหมาย PDPA สำหรับระบบ GovTrip Intelligence

## Authentication & Authorization

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Token Lifetime**: 24 hours (access token), 30 days (refresh token)
- **Password Requirements**:
  - Minimum 12 characters
  - Must contain uppercase, lowercase, numbers, special characters
  - Cannot reuse last 5 passwords
  - Must change every 90 days

### Authorization (RBAC)
```
Role Hierarchy:
Admin > Manager > Driver
        Manager > Auditor

Permissions Matrix:
- CREATE_TRIP: Driver, Manager, Admin
- APPROVE_TRIP: Manager, Admin
- DELETE_TRIP: Admin only
- VIEW_ALL_TRIPS: Manager, Admin, Auditor
- EXPORT_DATA: Manager, Admin, Auditor
- MANAGE_USERS: Admin only
```

## Data Protection (PDPA Compliance)

### Personal Data Classification
1. **Highly Sensitive**: ID card, passport, financial data
2. **Sensitive**: Name, phone, email, GPS locations
3. **Public**: Department, role, vehicle type

### PII Protection Measures
- **Masking**: Auto-mask PII in logs and exports
- **Encryption**: AES-256 for data at rest, TLS 1.3 for data in transit
- **Access Control**: Need-to-know basis only
- **Retention**: Delete Personal Data after legal retention period

### Data Subject Rights
Users have the right to:
- **Access**: Request copy of their personal data
- **Rectification**: Correct inaccurate data
- **Erasure "Right to be Forgotten"**: Request deletion (subject to legal obligations)
- **Portability**: Export data in machine-readable format
- **Object**: Opt-out of certain processing

## GPS Data Security

### Collection
- Collect only when trip is active
- User consent required
- Minimum accuracy: 50 meters
- No collection during off-duty hours

### Storage
- Encrypted at rest
- Pseudonymized for analytics
- Retention: 3 years, then anonymized or deleted

### Sharing
- Internal use only
- No third-party sharing without explicit consent
- Masked in reports (reduced precision to district level)

## Audit Trails

### Logging Requirements
ALL actions must be logged:
- User login/logout
- Trip creation/update/approval/deletion
- Data export
- Configuration changes
- System errors
- Security events

### Audit Log Protection
- **Immutable**: Cannot be modified or deleted
- **Hash Chain**: Each log entry includes hash of previous entry
- **Retention**: 10 years minimum
- **Access**: Auditor and Admin roles only

## Security Best Practices

### For Developers
```typescript
// ✅ GOOD: Use prepared statements
const trip = await prisma.trip.findUnique({ where: { id: tripId } });

// ❌ BAD: SQL injection risk
const trip = await prisma.$queryRaw`SELECT * FROM trips WHERE id = ${tripId}`;

// ✅ GOOD: Validate input
const schema = z.object({ email: z.string().email() });
const validated = schema.parse(input);

// ❌ BAD: No validation
const email = req.body.email; // Unsafe!

// ✅ GOOD: Mask PII
const maskedName = maskName(userName);

// ❌ BAD: Expose PII in logs
console.log(`User ${userName} logged in`); // Don't do this!
```

### For Administrators
- Enable MFA for all admin accounts
- Review audit logs weekly
- Rotate API keys monthly
- Keep software updated
- Conduct security training quarterly

### For Users
- Never share passwords
- Lock screen when away
- Report suspicious activity immediately
- Use strong, unique passwords
- Enable notifications for account activity

## Incident Response

### Security Incident Classification
- **Critical**: Data breach, system compromise
- **High**: Unauthorized access attempt, malware
- **Medium**: Policy violation, suspicious activity
- **Low**: Failed login attempts, minor errors

### Response Procedure
1. **Detect**: Automated alerts + manual monitoring
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze audit logs
4. **Remediate**: Fix vulnerability
5. **Report**: Notify stakeholders (PDPA requires notification within 72 hours)
6. **Review**: Post-incident analysis

### Contact
- **Security Team**: security@govtrip.go.th
- **PDPA Officer**: dpo@govtrip.go.th
- **Emergency**: +66-x-xxxx-xxxx

## Compliance Checklist

### PDPA Compliance
- [ ] Data Processing Agreement documented
- [ ] Consent mechanism implemented
- [ ] Privacy Notice published
- [ ] Data Subject Rights request process
- [ ] Data breach notification process
- [ ] DPO (Data Protection Officer) appointed
- [ ] DPIA (Data Protection Impact Assessment) completed

### IT Security Standards
- [ ] Firewall configured
- [ ] IDS/IPS enabled
- [ ] Regular penetration testing
- [ ] Backup and disaster recovery tested
- [ ] Encryption enabled (at rest and in transit)
- [ ] Access control implemented
- [ ] Security monitoring active

## Vulnerability Disclosure

If you discover a security vulnerability:
1. **DO NOT** disclose publicly
2. Email: security@govtrip.go.th
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
4. We will respond within 48 hours
5. Coordinated disclosure timeline: 90 days

## Updates
This document is reviewed and updated quarterly.

**Last Updated**: 2025-01-21  
**Next Review**: 2025-04-21  
**Version**: 1.0
