// ════════ register-screen.tsx — dedicated registration screen (staff/admin) ════════
"use client";

import { useEffect, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import {
  registerAdmin,
  registerStaff,
  resendAdminOtp,
  verifyAdminOtp,
  verifyStaffPin
} from "../../lib/api/gateway";
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

type RegisterRole = "staff" | "admin";

type RoleConfig = {
  color: string;
  colorD: string;
  activeClass: string;
};

const roleConfig: Record<RegisterRole, RoleConfig> = {
  staff: {
    color: "#f97316",
    colorD: "rgba(249,115,22,0.10)",
    activeClass: "activeStaff"
  },
  admin: {
    color: "#a78bfa",
    colorD: "rgba(167,139,250,0.10)",
    activeClass: "activeAdmin"
  }
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordStrength(pw: string): { label: string; color: string } {
  if (pw.length === 0) return { label: "", color: "transparent" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[#?!@$%^&*\-]/.test(pw);
  if (pw.length >= 12 && hasUpper && hasLower && hasDigit && hasSpecial) {
    return { label: "Strong", color: "#34d98b" };
  }
  if (pw.length >= 8) {
    return { label: "Fair", color: "#f5a623" };
  }
  return { label: "Weak", color: "#ff5f5f" };
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).map((name) => styles[name as keyof typeof styles] ?? name).join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function RegisterScreen() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<RegisterRole>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [verificationPin, setVerificationPin] = useState("");
  const [registerStep, setRegisterStep] = useState<"request" | "verify">("request");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [emailError, setEmailError] = useState(false);
  // OTP countdown + resend cooldown
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpCountdown, setOtpCountdown] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  const activeRole = roleConfig[role];
  const strength = getPasswordStrength(password);

  // Custom cursor
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

  // Parallax orbs
  useEffect(() => {
    const handleParallax = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      if (orbOneRef.current) {
        orbOneRef.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      }
      if (orbTwoRef.current) {
        orbTwoRef.current.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
      }
    };
    document.addEventListener("mousemove", handleParallax);
    return () => document.removeEventListener("mousemove", handleParallax);
  }, []);

  // OTP expiry countdown
  useEffect(() => {
    if (!otpExpiresAt) return;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, otpExpiresAt - Date.now());
      if (remaining === 0) {
        setOtpCountdown("Expired");
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setOtpCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
    }, 500);
    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Toast auto-dismiss (success only — errors stay until next action)
  useEffect(() => {
    if (!toast || toast.tone !== "success") return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleRoleChange = (nextRole: RegisterRole) => {
    setRole(nextRole);
    setToast(null);
    setRegisterStep("request");
    setVerificationPin("");
    setEmailError(false);
    setOtpExpiresAt(null);
    setOtpCountdown("");
    setResendCooldown(0);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Honeypot check
    if (honeypot.length > 0) return;

    setToast(null);
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    if (strength.label !== "Strong") {
      setToast({ tone: "error", message: "Password must be 12+ chars with uppercase, lowercase, number and special char (#?!@$%^&*-)." });
      return;
    }
    setConfirmPasswordError(false);

    // Confirm password validation
    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      return;
    }

    setRegisterLoading(true);

    if (role === "admin") {
      const response = await registerAdmin(normalizedEmail, password);
      setRegisterLoading(false);
      if (!response.success) {
        setToast({ tone: "error", message: response.error?.message ?? "Unable to register admin account." });
        return;
      }
      setToast({ tone: "success", message: "OTP sent to your email. Enter it below to verify your admin account." });
      setRegisterStep("verify");
      // Start 15-minute OTP countdown and 60-second resend cooldown
      setOtpExpiresAt(Date.now() + 15 * 60 * 1000);
      setResendCooldown(60);
      return;
    }

    // Staff registration
    const response = await registerStaff(normalizedEmail, password);
    setRegisterLoading(false);
    if (!response.success) {
      setToast({ tone: "error", message: response.error?.message ?? "Unable to create staff registration request." });
      return;
    }
    setToast({ tone: "success", message: "Request sent to admin. Wait for approval, then enter your 6-digit PIN below." });
    setRegisterStep("verify");
  };

  const handleVerifyPin = async (event: React.FormEvent<HTMLFormElement>, pinOverride?: string) => {
    event.preventDefault();
    setToast(null);
    // pinOverride is supplied by the auto-submit path (onChange/onPaste) so we
    // use the fresh local value rather than the stale React state closure.
    const pin = pinOverride ?? verificationPin;
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    if (!/^\d{6}$/.test(pin.trim())) {
      setToast({ tone: "error", message: "Enter a valid 6-digit verification PIN." });
      return;
    }
    setRegisterLoading(true);
    const response =
      role === "admin"
        ? await verifyAdminOtp(normalizedEmail, pin.trim())
        : await verifyStaffPin(normalizedEmail, pin.trim());
    setRegisterLoading(false);
    if (!response.success) {
      setToast({ tone: "error", message: response.error?.message ?? "Unable to verify code." });
      return;
    }
    window.location.href = "/internal/login?registered=1";
  };

  const handleResendAdminOtp = async (): Promise<void> => {
    if (role !== "admin") return;
    setToast(null);
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    setResendLoading(true);
    const response = await resendAdminOtp(normalizedEmail);
    setResendLoading(false);
    if (!response.success) {
      setToast({ tone: "error", message: response.error?.message ?? "Unable to resend OTP." });
      return;
    }
    setToast({ tone: "success", message: "A new OTP was sent to your email." });
    // Reset countdown and resend cooldown
    setOtpExpiresAt(Date.now() + 15 * 60 * 1000);
    setResendCooldown(60);
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
        {/* Left panel */}
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
                  role === "staff"
                    ? "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)"
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
                  role === "staff"
                    ? "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)"
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
                {role === "staff" ? "Staff Workspace" : "Admin Dashboard"}
              </div>
              <h1 className={styles.heroTitle}>
                {role === "staff" ? "Join the" : "Register as"}
                <br />
                <em style={{ color: activeRole.color }}>
                  {role === "staff" ? "team." : "admin."}
                </em>
              </h1>
              <p className={styles.heroSub}>
                {role === "staff"
                  ? "Submit your registration request. Once approved by an admin, you'll receive a PIN to complete setup."
                  : "Admin accounts are verified via email OTP. Registration is restricted by allowlist."}
              </p>
            </div>

            <div className={styles.featureList}>
              {(role === "staff"
                ? [
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="1.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Request access", sub: "Submit your staff registration" },
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: "Admin approval", sub: "An admin reviews and approves" },
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M9.5 10.5l5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/><path d="M13 14l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "PIN verification", sub: "Enter your 6-digit PIN to activate" }
                  ]
                : [
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Email OTP", sub: "Verify identity via one-time code" },
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: "Allowlist protected", sub: "Admin registration is restricted" },
                    { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1.5l7 3v5c0 4-3.2 6.8-7 8.5-3.8-1.7-7-4.5-7-8.5v-5l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>, text: "Full admin access", sub: "Control all users and settings" }
                  ]
              ).map((feature, index) => (
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

        {/* Right panel — form */}
        <div className={styles.right}>
          <div className={styles.dotGrid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={styles.dotGridDot} />
            ))}
          </div>

          <div className={styles.formWrap}>
            {/* Role tab selector — compact pill tabs */}
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

            <a
              href="/internal/login"
              className={styles.backButton}
              style={{ display: "inline-flex", marginBottom: 28 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Back to sign in
            </a>

            <div className={styles.formHeader}>
              <div className={styles.formTitle}>
                Register {role === "admin" ? "admin" : "staff"} account
              </div>
              <div className={styles.formSub}>
                {role === "admin"
                  ? "Admin registration is restricted by allowlist."
                  : "Staff registration requires admin approval and PIN verification."}
              </div>
            </div>

            {registerStep === "request" ? (
              <form onSubmit={handleRegister} noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="nope"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
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
                      }}
                      onBlur={() => {
                        if (email.length > 0) setEmailError(!isValidEmail(email.trim()));
                      }}
                    />
                    <span className={styles.fieldIcon}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
                  </div>
                  <span className={cx("fieldError", emailError && "fieldErrorVisible")}>Please enter a valid email address.</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Password</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="password"
                      className={styles.fieldInput}
                      placeholder="At least 12 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <span className={styles.fieldIcon}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2.5" y="6.5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
                  </div>
                  {/* Password requirements checklist */}
                  {password.length > 0 ? (
                    <div className={cx("pwReqs")}>
                      {([
                        { label: "12+ characters", met: password.length >= 12 },
                        { label: "Uppercase letter", met: /[A-Z]/.test(password) },
                        { label: "Lowercase letter", met: /[a-z]/.test(password) },
                        { label: "Number", met: /[0-9]/.test(password) },
                        { label: "Special char (#?!@$%^&*-)", met: /[#?!@$%^&*\-]/.test(password) }
                      ] as { label: string; met: boolean }[]).map(({ label, met }) => (
                        <span key={label} className={cx("pwReqItem", met && "pwReqMet")}>
                          {met ? "✓" : "✗"} {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Confirm Password</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="password"
                      className={cx("fieldInput", confirmPasswordError && "fieldInputError")}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setConfirmPasswordError(false);
                      }}
                      onBlur={() => {
                        if (confirmPassword.length > 0) setConfirmPasswordError(confirmPassword !== password);
                      }}
                    />
                    <span className={styles.fieldIcon}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2.5" y="6.5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
                  </div>
                  <span className={cx("fieldError", confirmPasswordError && "fieldErrorVisible")}>Passwords do not match.</span>
                </div>

                {/* Staff approval info box */}
                {role === "staff" ? (
                  <div
                    className={styles.resetSuccess}
                    style={{ background: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.2)", color: "#f97316", marginBottom: 16 }}
                  >
                    Your request will be reviewed by an admin. Once approved, you&apos;ll receive a 6-digit PIN to complete activation.
                  </div>
                ) : null}

                <button
                  className={cx("submitButton", registerLoading && "submitButtonLoading")}
                  type="submit"
                  disabled={registerLoading}
                  style={registerLoading ? { opacity: 0.45, pointerEvents: "none" } : undefined}
                >
                  <span className={styles.submitText}>
                    {role === "admin" ? "Register & Send OTP" : "Request Staff Access"}
                  </span>
                  <span className={styles.submitLoader}>
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                  </span>
                </button>
              </form>
            ) : null}

            {registerStep === "verify" ? (
              <form onSubmit={handleVerifyPin} noValidate style={{ marginTop: 14 }}>
                <div className={styles.resetSuccess}>
                  {role === "admin"
                    ? `Code sent to ${email}. Enter OTP to continue.`
                    : `Request submitted for ${email}. Enter PIN after admin approval.`}
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    {role === "admin" ? "Email OTP" : "Verification PIN"}
                    {/* Countdown for admin OTP expiry */}
                    {role === "admin" && otpCountdown ? (
                      <span
                        style={{
                          marginLeft: 10,
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.65rem",
                          color: otpCountdown === "Expired" ? "#ff5f5f" : "var(--muted, #888)"
                        }}
                      >
                        {otpCountdown === "Expired" ? "Code expired" : `Expires in ${otpCountdown}`}
                      </span>
                    ) : null}
                  </label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className={styles.fieldInput}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      autoFocus
                      value={verificationPin}
                      onChange={(event) => {
                        // Allow only digits
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setVerificationPin(digits);
                        // Auto-submit when 6 digits entered — pass digits directly
                        // to avoid reading stale verificationPin state.
                        if (digits.length === 6) {
                          void handleVerifyPin({ preventDefault: () => undefined } as React.FormEvent<HTMLFormElement>, digits);
                        }
                      }}
                      onPaste={(event) => {
                        event.preventDefault();
                        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        setVerificationPin(pasted);
                        if (pasted.length === 6) {
                          void handleVerifyPin({ preventDefault: () => undefined } as React.FormEvent<HTMLFormElement>, pasted);
                        }
                      }}
                    />
                    <span className={styles.fieldIcon}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><line x1="5" y1="2" x2="4" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="10" y1="2" x2="9" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="2" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="2" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
                  </div>
                </div>

                <button
                  className={cx("submitButton", registerLoading && "submitButtonLoading")}
                  type="submit"
                  disabled={registerLoading}
                  style={registerLoading ? { opacity: 0.45, pointerEvents: "none" } : undefined}
                >
                  <span className={styles.submitText}>{role === "admin" ? "Verify OTP" : "Verify PIN"}</span>
                  <span className={styles.submitLoader}>
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                  </span>
                </button>

                {role === "admin" ? (
                  <button
                    type="button"
                    className={styles.inlineLink}
                    style={{ marginTop: 10, display: "inline-block", opacity: resendCooldown > 0 ? 0.5 : 1 }}
                    onClick={() => void handleResendAdminOtp()}
                    disabled={resendLoading || resendCooldown > 0}
                  >
                    {resendLoading
                      ? "Resending OTP..."
                      : resendCooldown > 0
                      ? `Resend OTP (${resendCooldown}s)`
                      : "Resend OTP"}
                  </button>
                ) : null}

                <button
                  type="button"
                  className={styles.inlineLink}
                  style={{ marginTop: 10, marginLeft: role === "admin" ? 12 : 0, display: "inline-block" }}
                  onClick={() => setRegisterStep("request")}
                >
                  Edit details
                </button>
              </form>
            ) : null}

            <div className={styles.formFooter} style={{ marginTop: 24 }}>
              Already have an account?{" "}
              <a href="/internal/login" style={{ color: activeRole.color, textDecoration: "none" }}>
                Sign in →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating toast */}
      {toast ? (
        <div className={cx("authToast", toast.tone === "success" ? "authToastSuccess" : "authToastError")}>
          <span className={cx("authToastIcon")}>{toast.tone === "success" ? "✓" : "✕"}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.tone === "error" && (
            <button type="button" onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 0 0 10px", fontSize: "1rem", lineHeight: 1, opacity: 0.7 }}>×</button>
          )}
        </div>
      ) : null}
    </div>
  );
}
