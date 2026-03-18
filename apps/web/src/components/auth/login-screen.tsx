// ════════ login-screen.tsx — login-only auth screen with honeypot + lockout ════════
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import { login, twoFactorLogin } from "../../lib/api/gateway";
import { sanitizeNextPath } from "../../lib/auth/routing";
import { loadSession, saveSession } from "../../lib/auth/session";
import type { Role } from "@maphari/contracts";
import styles from "../../app/style/maphari-login.module.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono"
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument"
});

type LoginRole = "client" | "staff" | "admin";

type RoleConfig = {
  color: string;
  colorD: string;
  eyebrow: string;
  title: string;
  em: string;
  sub: string;
  sub2: string;
  features: Array<{ icon: React.ReactNode; text: string; sub: string }>;
  activeClass: string;
};

const roleConfig: Record<LoginRole, RoleConfig> = {
  client: {
    color: "#c8f135",
    colorD: "rgba(200,241,53,0.10)",
    eyebrow: "Client Portal",
    title: "Your project,",
    em: "always visible.",
    sub: "Track progress, review milestones, communicate with your team, and manage payments — all in one place.",
    sub2: "Sign in to your client portal to continue.",
    features: [
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="10" width="3.5" height="7" rx="1" fill="currentColor"/><rect x="7.25" y="6" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="13.5" y="2" width="3.5" height="15" rx="1" fill="currentColor"/></svg>, text: "Project progress & milestones", sub: "Real-time updates across all builds" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="2" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M4 16l3-3h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Direct team communication", sub: "Message Maphari staff instantly" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 2h12v14l-2-1.5L11 16l-2-1.5L7 16l-2-1.5L3 16V2z" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Invoice & payment management", sub: "View, download, and pay invoices" }
    ],
    activeClass: "activeClient"
  },
  staff: {
    color: "#4f9eff",
    colorD: "rgba(79,158,255,0.10)",
    eyebrow: "Staff Workspace",
    title: "Build faster,",
    em: "ship with clarity.",
    sub: "Manage your tasks, track time, deliver to clients, and keep sprints on target — all from one workspace.",
    sub2: "Sign in to your staff workspace to continue.",
    features: [
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: "Tasks, Kanban & sprint tracking", sub: "Prioritise and move work forward" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>, text: "Time logging & weekly targets", sub: "Track hours per project easily" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1.5L16.5 5.5v7L9 16.5 1.5 12.5v-7L9 1.5z" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="1.5" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.5"/><line x1="1.5" y1="5.5" x2="16.5" y2="5.5" stroke="currentColor" strokeWidth="1.5"/></svg>, text: "Client deliverable management", sub: "Know what's due and when" }
    ],
    activeClass: "activeStaff"
  },
  admin: {
    color: "#a78bfa",
    colorD: "rgba(167,139,250,0.10)",
    eyebrow: "Admin Dashboard",
    title: "Full visibility,",
    em: "total control.",
    sub: "Oversee all clients, projects, revenue, and team output. Every metric, one screen.",
    sub2: "Sign in to the admin dashboard to continue.",
    features: [
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><polyline points="1,14 6,8 10,11 17,4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/><polyline points="12,4 17,4 17,9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>, text: "Revenue & client analytics", sub: "Track billing, LTV, and growth" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/></svg>, text: "All projects & staff output", sub: "Manage every engagement in one view" },
      { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Access & permission control", sub: "Manage roles across all users" }
    ],
    activeClass: "activeAdmin"
  }
};

// AppType controls which role tabs are shown and page metadata.
//   "client" → client.mapharitechnologies.com → client-only login (same as "public" functionally)
//   "staff"  → staff subdomain  → staff tab only
//   "admin"  → admin subdomain  → admin tab only
//   "both"   → main domain / local dev → staff + admin tabs (default internal behaviour)
//   "public" → main domain client login (no change)
type AppType = "client" | "staff" | "admin" | "both" | "public";

interface LoginScreenProps {
  nextPathParam?: string;
  mode?: "public" | "internal";
  appType?: AppType;
  registeredSuccess?: boolean;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initialRoleForAppType(appType: AppType, mode: "public" | "internal"): LoginRole {
  if (mode !== "internal") return "client";
  if (appType === "admin") return "admin";
  return "staff"; // "staff" | "both" | "public" → default to staff
}

export function LoginScreen({ nextPathParam, mode = "public", appType = "both", registeredSuccess = false }: LoginScreenProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);
  const orbThreeRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<LoginRole>(initialRoleForAppType(appType, mode));
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [successText, setSuccessText] = useState("Signed in successfully");
  const [networkError, setNetworkError] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // 2FA challenge state — shown after a successful password check when TOTP is enabled
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpLoginCode, setTotpLoginCode] = useState("");
  const [totpLoginError, setTotpLoginError] = useState("");
  const [totpLoginLoading, setTotpLoginLoading] = useState(false);

  // Honeypot — uncontrolled ref so browser autofill can't update React state
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [lockMessage, setLockMessage] = useState("");

  const nextPath = useMemo(() => sanitizeNextPath(nextPathParam), [nextPathParam]);
  const isInternal = mode === "internal";
  const requiresPassword = isInternal;
  const selectedRole: Role =
    mode === "public"
      ? "CLIENT"
      : role === "admin"
      ? "ADMIN"
      : "STAFF";

  const activeRole = roleConfig[role];

  // Update lock message on a tick
  useEffect(() => {
    if (lockedUntil === 0) return;
    const interval = window.setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setLockMessage("");
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  useEffect(() => {
    const existing = loadSession();
    if (!existing) return;
    const target = nextPath ?? (existing.user.role === "CLIENT" ? "/client" : existing.user.role === "STAFF" ? "/staff" : "/admin");
    window.location.href = target;
  }, [nextPath]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let frameId = 0;

    const moveCursor = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
      }
      frameId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", moveCursor);
    animateRing();

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const handleParallax = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      if (orbOneRef.current) {
        orbOneRef.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      }
      if (orbTwoRef.current) {
        orbTwoRef.current.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
      }
      if (orbThreeRef.current) {
        orbThreeRef.current.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      }
    };

    document.addEventListener("mousemove", handleParallax);
    return () => document.removeEventListener("mousemove", handleParallax);
  }, []);

  const features = activeRole.features;

  const handleRoleChange = (nextRole: LoginRole) => {
    if (!isInternal && nextRole !== "client") return;
    if (isInternal && nextRole === "client") return;
    setRole(nextRole);
    setEmailError(false);
    setPasswordError(false);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Honeypot check — bots that filled this field are silently dropped
    if ((honeypotRef.current?.value ?? "").length > 0) return;

    // Lockout check
    if (lockedUntil > 0 && Date.now() < lockedUntil) {
      setLockMessage("Too many failed attempts. Please wait 30 seconds.");
      return;
    }

    const normalizedEmail = email.trim();
    const validEmail = isValidEmail(normalizedEmail);
    const validPassword = !requiresPassword || password.length >= 8;

    setEmailError(!validEmail);
    setPasswordError(!validPassword);
    setInvalidCredentials(false);

    if (!validEmail || !validPassword) { triggerShake(); return; }

    setLoginLoading(true);

    let response;
    try {
      response = await login(normalizedEmail, {
        role: selectedRole,
        rememberMe,
        ...(requiresPassword ? { password } : {})
      });
    } catch {
      setLoginLoading(false);
      setNetworkError(true);
      triggerShake();
      return;
    }

    if (!response.success || !response.data) {
      setLoginLoading(false);
      setInvalidCredentials(true);
      triggerShake();
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);
      if (nextFailedAttempts >= 5) {
        setLockedUntil(Date.now() + 30000);
        setLockMessage("Too many failed attempts. Please wait 30 seconds.");
      }
      return;
    }

    // 2FA gate — if the backend signals the user has TOTP enabled, show the
    // code entry step instead of immediately saving the session.
    if (response.data && "requiresTwoFactor" in response.data && response.data.requiresTwoFactor) {
      setTempToken((response.data as unknown as { tempToken: string }).tempToken);
      setRequiresTwoFactor(true);
      setLoginLoading(false);
      return;
    }

    saveSession(response.data);
    setLoginLoading(false);
    setSuccessOverlay(true);

    window.setTimeout(() => {
      const resolvedRole = response.data?.user.role ?? selectedRole;
      setSuccessText(
        resolvedRole === "CLIENT" ? "Loading your portal…" : resolvedRole === "STAFF" ? "Loading your workspace…" : "Loading admin dashboard…"
      );
    }, 2200);

    window.setTimeout(() => {
      const resolvedRole = response.data?.user.role ?? selectedRole;
      const target = nextPath ?? (resolvedRole === "CLIENT" ? "/client" : resolvedRole === "STAFF" ? "/staff" : "/admin");
      window.location.href = target;
    }, 2600);
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpLoginCode.trim() || totpLoginCode.length < 6) {
      setTotpLoginError("Enter the 6-digit code from your authenticator app.");
      triggerShake();
      return;
    }
    setTotpLoginLoading(true);
    setTotpLoginError("");
    try {
      const response = await twoFactorLogin(tempToken, totpLoginCode.trim());
      if (!response.success || !response.data) {
        setTotpLoginError(response.error?.message ?? "Invalid code. Please try again.");
        setTotpLoginLoading(false);
        triggerShake();
        return;
      }
      saveSession(response.data);
      setTotpLoginLoading(false);
      setSuccessOverlay(true);

      window.setTimeout(() => {
        const resolvedRole = response.data?.user.role ?? selectedRole;
        setSuccessText(
          resolvedRole === "CLIENT" ? "Loading your portal…" : resolvedRole === "STAFF" ? "Loading your workspace…" : "Loading admin dashboard…"
        );
      }, 2200);

      window.setTimeout(() => {
        const resolvedRole = response.data?.user.role ?? selectedRole;
        const target = nextPath ?? (resolvedRole === "CLIENT" ? "/client" : resolvedRole === "STAFF" ? "/staff" : "/admin");
        window.location.href = target;
      }, 2600);
    } catch {
      setTotpLoginError("Network error. Please try again.");
      setTotpLoginLoading(false);
      triggerShake();
    }
  };

  const isLocked = lockedUntil > 0 && Date.now() < lockedUntil;

  const triggerShake = () => {
    setShakeForm(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShakeForm(true));
    });
  };

  return (
    <div
      className={`${styles.loginRoot} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}
      style={
        {
          "--active": activeRole.color,
          "--active-d": activeRole.colorD
        } as React.CSSProperties
      }
    >
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} style={{ borderColor: `${activeRole.color}55` }} />

      <div className={styles.shell}>
        <div className={styles.left}>
          <div className={styles.mesh}>
            <div
              ref={orbOneRef}
              className={styles.meshOrb}
              style={{
                width: 500,
                height: 500,
                top: -120,
                left: -120,
                background:
                  role === "client"
                    ? "radial-gradient(circle, rgba(200,241,53,0.12) 0%, transparent 70%)"
                    : role === "staff"
                    ? "radial-gradient(circle, rgba(79,158,255,0.14) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)"
              }}
            />
            <div
              ref={orbTwoRef}
              className={styles.meshOrb}
              style={{
                width: 400,
                height: 400,
                bottom: -100,
                right: -100,
                background:
                  role === "client"
                    ? "radial-gradient(circle, rgba(79,158,255,0.10) 0%, transparent 70%)"
                    : role === "staff"
                    ? "radial-gradient(circle, rgba(200,241,53,0.08) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(79,158,255,0.08) 0%, transparent 70%)"
              }}
            />
            <div
              ref={orbThreeRef}
              className={styles.meshOrb}
              style={{
                width: 300,
                height: 300,
                top: "40%",
                left: "30%",
                background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)"
              }}
            />
          </div>

          <div className={styles.cornerDeco}>
            <div className={styles.cornerDecoLine} style={{ width: 48 }} />
            <div className={styles.cornerDecoLine} style={{ width: 32 }} />
            <div className={styles.cornerDecoLine} style={{ width: 20 }} />
          </div>

          <div className={styles.leftContent}>
            <div className={styles.logo}>
              <div className={styles.logoMark} style={{ background: activeRole.color }}>
                M
              </div>
              <div className={styles.logoText}>
                Maph<span style={{ color: activeRole.color }}>a</span>ri
              </div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroEyebrow} style={{ color: activeRole.color }}>
                <span className={styles.heroEyebrowLine} style={{ background: activeRole.color }} />
                {activeRole.eyebrow}
              </div>
              <h1 className={styles.heroTitle}>
                {activeRole.title}
                <br />
                <em style={{ color: activeRole.color }}>{activeRole.em}</em>
              </h1>
              <p className={styles.heroSub}>{activeRole.sub}</p>
            </div>

            <div className={styles.featureList}>
              {features.map((feature, index) => (
                <div key={feature.text} className={styles.feature} style={{ animationDelay: `${0.05 + index * 0.07}s` }}>
                  <div className={styles.featureIcon} style={{ background: activeRole.colorD }}>
                    {feature.icon}
                  </div>
                  <div>
                    <div className={styles.featureText}>{feature.text}</div>
                    <div className={styles.featureSub}>{feature.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.roleDesc} style={{ background: activeRole.color }} />
        </div>

        <div className={styles.right}>
          <div className={styles.dotGrid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={styles.dotGridDot} />
            ))}
          </div>

          <div
            className={`${styles.formWrap}${shakeForm ? ` ${styles.formShake}` : ""}`}
            onAnimationEnd={() => setShakeForm(false)}
          >
            {requiresTwoFactor ? (
              <>
                <div className={styles.formHeader}>
                  <div className={styles.formTitle}>Two-Factor Authentication</div>
                  <div className={styles.formSub}>Enter the 6-digit code from your authenticator app.</div>
                </div>

                <form onSubmit={handleTwoFactorSubmit} noValidate>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Authenticator Code</label>
                    <div className={styles.fieldInputWrap}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        autoComplete="one-time-code"
                        className={cx("fieldInput", totpLoginError ? "fieldInputError" : undefined)}
                        placeholder="000000"
                        value={totpLoginCode}
                        onChange={(event) => {
                          const val = event.target.value.replace(/\D/g, "").slice(0, 6);
                          setTotpLoginCode(val);
                          setTotpLoginError("");
                        }}
                      />
                      <span className={styles.fieldIcon}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="3" y="6.5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </span>
                    </div>
                    {totpLoginError ? (
                      <span className={cx("fieldError", "fieldErrorVisible")}>{totpLoginError}</span>
                    ) : (
                      <span className={cx("fieldError")} />
                    )}
                  </div>

                  <button
                    className={cx("submitButton", totpLoginLoading && "submitButtonLoading")}
                    type="submit"
                    disabled={totpLoginLoading}
                    style={totpLoginLoading ? { opacity: 0.45, pointerEvents: "none" } : undefined}
                  >
                    <span className={styles.submitText}>Verify Code →</span>
                    <span className={styles.submitLoader}>
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                    </span>
                  </button>
                </form>

                <div className={styles.formFooter}>
                  <button
                    className={styles.inlineLink}
                    type="button"
                    onClick={() => {
                      setRequiresTwoFactor(false);
                      setTempToken("");
                      setTotpLoginCode("");
                      setTotpLoginError("");
                    }}
                  >
                    ← Back to login
                  </button>
                </div>
              </>
            ) : null}

            {!requiresTwoFactor && isInternal && appType === "both" && (
              <div className={styles.roleTabs}>
                <button
                  type="button"
                  className={cx("roleTab", role === "staff" && "activeStaff")}
                  onClick={() => handleRoleChange("staff")}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Staff
                </button>
                <button
                  type="button"
                  className={cx("roleTab", role === "admin" && "activeAdmin")}
                  onClick={() => handleRoleChange("admin")}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1l5.5 2.2v3.5c0 3-2.2 5.3-5.5 6.5C3.7 12 1.5 9.7 1.5 6.7V3.2L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                  Admin
                </button>
              </div>
            )}

            {!requiresTwoFactor && registeredSuccess ? (
              <div className={styles.resetSuccess} style={{ marginBottom: 20 }}>
                Account registered successfully. You can now sign in.
              </div>
            ) : null}

            {!requiresTwoFactor ? (
            <div className={styles.formHeader}>
              <div className={styles.formTitle}>Welcome back</div>
              <div className={styles.formSub}>{activeRole.sub2}</div>
            </div>
            ) : null}

            {!requiresTwoFactor ? (<form onSubmit={handleLogin} noValidate>
              {/* Honeypot — hidden from real users, bots fill it */}
              <input
                ref={honeypotRef}
                type="text"
                name="_confirm_alt"
                tabIndex={-1}
                autoComplete="new-password"
                defaultValue=""
                style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
                aria-hidden="true"
              />

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email Address</label>
                <div className={styles.fieldInputWrap}>
                  <input
                    type="email"
                    className={cx("fieldInput", emailError && "fieldInputError")}
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError(false);
                      setInvalidCredentials(false);
                      setNetworkError(false);
                    }}
                  />
                  <span className={styles.fieldIcon}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </span>
                </div>
                <span className={cx("fieldError", emailError && "fieldErrorVisible")}>Please enter a valid email address.</span>
              </div>

              {requiresPassword ? (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Password
                    <button
                      className={styles.fieldLink}
                      type="button"
                      onClick={() => { window.location.href = "/forgot-password"; }}
                    >
                      Forgot password?
                    </button>
                  </label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={cx("fieldInput", passwordError && "fieldInputError")}
                      placeholder="••••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError(false);
                        setInvalidCredentials(false);
                        setNetworkError(false);
                      }}
                    />
                    <button className={styles.fieldIcon} type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
                      }
                    </button>
                  </div>
                  <span className={cx("fieldError", passwordError && "fieldErrorVisible")}>
                    Password must be at least 8 characters.
                  </span>
                </div>
              ) : null}

              <div className={styles.optionsRow}>
                <button className={styles.checkboxWrap} type="button" onClick={() => setRememberMe((prev) => !prev)}>
                  <div className={cx("checkbox", rememberMe && "checkboxChecked")}>{rememberMe ? "✓" : ""}</div>
                  <span className={styles.checkboxLabel}>Keep me signed in</span>
                </button>
              </div>

              {invalidCredentials ? (
                <div className={styles.resetSuccess} style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f", marginBottom: 16 }}>
                  Invalid email or password. Please try again.
                </div>
              ) : null}

              {networkError ? (
                <div className={styles.resetSuccess} style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f", marginBottom: 16 }}>
                  Unable to connect to server. Please try again.
                </div>
              ) : null}

              {isLocked || lockMessage ? (
                <div className={styles.resetSuccess} style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f", marginBottom: 16 }}>
                  {lockMessage || "Too many failed attempts. Please wait 30 seconds."}
                </div>
              ) : null}

              <button
                className={cx("submitButton", loginLoading && "submitButtonLoading")}
                type="submit"
                disabled={isLocked || loginLoading}
                style={isLocked || loginLoading ? { opacity: 0.45, pointerEvents: "none" } : undefined}
              >
                <span className={styles.submitText}>Sign In →</span>
                <span className={styles.submitLoader}>
                  <span className={styles.loaderDot} />
                  <span className={styles.loaderDot} />
                  <span className={styles.loaderDot} />
                </span>
              </button>
            </form>) : null}

            {!requiresTwoFactor && requiresPassword ? (
              <>
                <div className={styles.orDivider}>
                  <div className={styles.orLine} />
                  <div className={styles.orText}>or</div>
                  <div className={styles.orLine} />
                </div>

                <button
                  className={styles.ssoButton}
                  type="button"
                  onClick={() => {
                    const gatewayBase =
                      process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";
                    window.location.href = `${gatewayBase}/auth/google`;
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </>
            ) : null}

            {!requiresTwoFactor ? (
            <div className={styles.formFooter}>
              {isInternal ? (
                <>
                  Need an account?{" "}
                  <button className={styles.inlineLink} type="button" onClick={() => { window.location.href = "/internal/register"; }}>
                    Register here
                  </button>
                </>
              ) : (
                <>Need access? <a href="/contact">Contact Maphari</a> · <a href="/privacy">Privacy Policy</a></>
              )}
            </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cx("successOverlay", successOverlay && "successOverlayShow")}>
        <div className={styles.successIcon} style={{ borderColor: activeRole.color, color: activeRole.color }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M6 14l5.5 5.5 10.5-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className={styles.successText}>{successText}</div>
        <div className={styles.successSub} style={{ color: activeRole.color }}>Redirecting to your portal…</div>
        <div className={styles.redirectBar}>
          <div className={styles.redirectFill} style={{ background: activeRole.color }} />
        </div>
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).map((name) => styles[name as keyof typeof styles] ?? name).join(" ");
}
