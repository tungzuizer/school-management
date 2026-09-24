/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: `src/lib/auth.ts`, `src/app/actions/user-password.ts`, `src/proxy.ts`, `src/lib/tenant.ts`.
 * 2. Affected APIs: `logSecurityEvent`, `SecurityEventType`, `SecuritySeverity`, `validatePasswordPolicy`.
 * 3. Purpose: Centralized structured security event logging and audit trails for compliance with OWASP Top 10 & Decree 13/2023/ND-CP.
 */

export type SecurityEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "RATE_LIMIT_TRIGGERED"
  | "RBAC_VIOLATION"
  | "PASSWORD_CHANGE_SUCCESS"
  | "PASSWORD_CHANGE_FAILURE"
  | "UNAUTHORIZED_ACCESS_ATTEMPT"
  | "PII_ACCESS_AUDIT";

export type SecuritySeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface SecurityEventPayload {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ip?: string;
  path?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityEventLog extends SecurityEventPayload {
  timestamp: string;
}

/**
 * Mask sensitive strings such as passwords, tokens, or emails before logging
 */
export function maskSensitiveValue(value: string): string {
  if (!value) return "";
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    if (local.length <= 2) return `*@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/**
 * Dispatches a structured security log event for auditing and SIEM integration
 */
export function logSecurityEvent(payload: SecurityEventPayload): SecurityEventLog {
  const logEntry: SecurityEventLog = {
    ...payload,
    userEmail: payload.userEmail ? maskSensitiveValue(payload.userEmail) : undefined,
    timestamp: new Date().toISOString(),
  };

  const formattedMessage = `[SECURITY_AUDIT] [${logEntry.severity}] [${logEntry.eventType}] ${logEntry.message} ${
    logEntry.userId ? `(User: ${logEntry.userId})` : ""
  } ${logEntry.userEmail ? `(Email: ${logEntry.userEmail})` : ""}`;

  if (logEntry.severity === "CRITICAL" || logEntry.severity === "ERROR") {
    console.error(formattedMessage, logEntry.metadata || "");
  } else if (logEntry.severity === "WARN") {
    console.warn(formattedMessage, logEntry.metadata || "");
  } else {
    console.info(formattedMessage, logEntry.metadata || "");
  }

  return logEntry;
}

/**
 * Common weak/default passwords blacklist
 */
export const WEAK_PASSWORDS_BLACKLIST = new Set([
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "abc123",
  "abcdef",
  "password",
  "admin",
  "admin123",
  "teacher",
  "student",
  "qwerty",
  "pholu2026",
  "thpholu",
  "welcome1",
]);

/**
 * Password Policy Enforcement Helper
 * - Minimum 8 characters
 * - Must contain at least one letter and at least one digit
 * - Must not be in the blacklist of common weak passwords
 */
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  const trimmed = password.trim();

  if (!trimmed || trimmed.length < 8) {
    return {
      valid: false,
      error: "Mật khẩu mới phải có tối thiểu 8 ký tự.",
    };
  }

  if (WEAK_PASSWORDS_BLACKLIST.has(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: "Mật khẩu này quá phổ biến hoặc là mật khẩu mặc định. Vui lòng chọn mật khẩu an toàn hơn.",
    };
  }

  const hasLetter = /[a-zA-Z]/.test(trimmed);
  const hasDigit = /[0-9]/.test(trimmed);

  if (!hasLetter || !hasDigit) {
    return {
      valid: false,
      error: "Mật khẩu mới phải kết hợp cả chữ cái và số để đảm bảo tính an toàn.",
    };
  }

  return { valid: true };
}
