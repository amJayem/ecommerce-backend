// src/auth/account-lockout.service.ts
import { Injectable } from '@nestjs/common';

interface LockoutEntry {
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

@Injectable()
export class AccountLockoutService {
  private lockoutMap = new Map<string, LockoutEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  isAccountLocked(email: string): boolean {
    const entry = this.lockoutMap.get(email);
    if (!entry) return false;

    // Check if lockout period has expired
    if (entry.lockedUntil && new Date() < entry.lockedUntil) {
      return true;
    }

    // Clear expired lockout
    if (entry.lockedUntil && new Date() >= entry.lockedUntil) {
      this.lockoutMap.delete(email);
      return false;
    }

    return false;
  }

  recordFailedAttempt(email: string): void {
    const entry = this.lockoutMap.get(email) || {
      attempts: 0,
      lastAttempt: new Date(),
    };

    entry.attempts += 1;
    entry.lastAttempt = new Date();

    // Lock account if max attempts reached
    if (entry.attempts >= this.MAX_ATTEMPTS) {
      entry.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    this.lockoutMap.set(email, entry);
  }

  recordSuccessfulLogin(email: string): void {
    // Clear lockout on successful login
    this.lockoutMap.delete(email);
  }

  getRemainingAttempts(email: string): number {
    const entry = this.lockoutMap.get(email);
    if (!entry) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - entry.attempts);
  }

  getLockoutTimeRemaining(email: string): number {
    const entry = this.lockoutMap.get(email);
    if (!entry || !entry.lockedUntil) return 0;

    const remaining = entry.lockedUntil.getTime() - Date.now();
    return Math.max(0, remaining);
  }
}
