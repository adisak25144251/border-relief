import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const { method, url, user, body, params } = req as any;

        // Skip GET requests for audit (unless PII, handled separately)
        if (method === 'GET') return next.handle();

        return next.handle().pipe(
            tap(async (response) => {
                // Log Success Actions
                if (user) {
                    await this.auditService.logAction(
                        user.userId,
                        `${method} ${url}`,
                        {
                            params,
                            bodyMasked: this.maskSensitive(body),
                            statusCode: context.switchToHttp().getResponse().statusCode
                        },
                        null
                    );
                }
            }),
        );
    }

    private maskSensitive(data: any) {
        if (!data) return data;
        const masked = { ...data };
        if (masked.password) masked.password = '***';
        if (masked.token) masked.token = '***';
        return masked;
    }
}
