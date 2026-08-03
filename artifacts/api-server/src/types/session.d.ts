import "express-session";

declare module "express-session" {
  interface SessionData {
    /** ID of the currently authenticated user */
    userId?: number;
    /** WebAuthn challenge stored between begin/finish calls */
    challenge?: string;
    /** Data held during a pending registration flow */
    pendingRegistration?: {
      username: string;
      displayName: string;
      origin: string;
    };
    /** Data held during a pending login flow */
    pendingAuth?: {
      userId: number;
      origin: string;
    };
  }
}
