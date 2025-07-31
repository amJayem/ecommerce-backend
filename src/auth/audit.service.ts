// src/auth/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface AuditEvent {
  userId?: number;
  email?: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'REFRESH_TOKEN'
    | 'REFRESH_FAILED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  logAuthEvent(event: AuditEvent): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(
        `Auth Event: ${event.action} - User: ${event.email || 'unknown'} - IP: ${
          event.ipAddress || 'unknown'
        }`,
      );
    }

    // TODO: In production, send to external logging service
    // This could be sent to a logging service like DataDog, LogRocket, etc.

    // For now, we'll just log to console with structured data
    this.logger.log({
      type: 'AUTH_AUDIT',
      ...event,
    });
  }

  logLoginSuccess(
    userId: number,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.logAuthEvent({
      userId,
      email,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  logLoginFailed(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.logAuthEvent({
      email,
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      timestamp: new Date(),
      details: { reason },
    });
  }

  logLogout(
    userId: number,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.logAuthEvent({
      userId,
      email,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  logTokenRefresh(
    userId: number,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.logAuthEvent({
      userId,
      email,
      action: 'REFRESH_TOKEN',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  logRefreshFailed(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.logAuthEvent({
      email,
      action: 'REFRESH_FAILED',
      ipAddress,
      userAgent,
      timestamp: new Date(),
      details: { reason },
    });
  }
}
