"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import { login, registerAdmin, registerStaff, resendAdminOtp, verifyAdminOtp, verifyStaffPin } from "../../lib/api/gateway";
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
  features: Array<{ icon: string; text: string; sub: string }>;
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
      { icon: "📊", text: "Project progress & milestones", sub: "Real-time updates across all builds" },
      { icon: "💬", text: "Direct team communication", sub: "Message Maphari staff instantly" },
      { icon: "🧾", text: "Invoice & payment management", sub: "View, download, and pay invoices" }
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
      { icon: "✅", text: "Tasks, Kanban & sprint tracking", sub: "Prioritise and move work forward" },
      { icon: "⏱", text: "Time logging & weekly targets", sub: "Track hours per project easily" },
      { icon: "📦", text: "Client deliverable management", sub: "Know what's due and when" }
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
      { icon: "📈", text: "Revenue & client analytics", sub: "Track billing, LTV, and growth" },
      { icon: "🗂", text: "All projects & staff output", sub: "Manage every engagement in one view" },
      { icon: "🔐", text: "Access & permission control", sub: "Manage roles across all users" }
    ],
    activeClass: "activeAdmin"
  }
};

const stepStates = {
  login: { step1: "active", step2: "" },
  forgot: { step1: "done", step2: "active" },
  register: { step1: "done", step2: "active" }
} as const;

interface LoginScreenProps {
  nextPathParam?: string;
  mode?: "public" | "internal";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginScreen({ nextPathParam, mode = "public" }: LoginScreenProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);
  const orbThreeRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<LoginRole>(mode === "internal" ? "staff" : "client");
  const [view, setView] = useState<"login" | "forgot" | "register">("login");
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [successText, setSuccessText] = useState("Signed in successfully");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState<"request" | "verify">("request");
  const [debugOtpHint, setDebugOtpHint] = useState<string | null>(null);
  const [registerPassword, setRegisterPassword] = useState("");
  const [verificationPin, setVerificationPin] = useState("");

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

  useEffect(() => {
    const existing = loadSession();
    if (!existing) return;
    const target = nextPath ?? (existing.user.role === "CLIENT" ? "/client" : existing.user.role === "STAFF" ? "/staff" : "/admin");
    window.location.href = target;
  }, [nextPath]);

  useEffect(() => {
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
    setView("login");
    setResetSuccess(false);
    setEmailError(false);
    setPasswordError(false);
    setResendLoading(false);
    setRegisterError(null);
    setRegisterSuccess(null);
    setRegisterStep("request");
    setDebugOtpHint(null);
    setRegisterPassword("");
    setVerificationPin("");
  };

  const openRegister = () => {
    setRegisterError(null);
    setRegisterSuccess(null);
    setRegisterStep("request");
    setDebugOtpHint(null);
    setVerificationPin("");
    setView("register");
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const validEmail = isValidEmail(normalizedEmail);
    const validPassword = !requiresPassword || password.length >= 8;

    setEmailError(!validEmail);
    setPasswordError(!validPassword);

    if (!validEmail || !validPassword) return;

    setLoginLoading(true);

    const response = await login(normalizedEmail, {
      role: selectedRole,
      rememberMe,
      ...(requiresPassword ? { password } : {})
    });
    if (!response.success || !response.data) {
      setLoginLoading(false);
      setPasswordError(true);
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

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validEmail = isValidEmail(email.trim());
    setEmailError(!validEmail);
    if (!validEmail) return;
    setResetLoading(true);
    window.setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 1500);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    setRegisterLoading(true);
    if (role === "admin") {
      if (registerPassword.length < 8) {
        setRegisterLoading(false);
        setRegisterError("Password must be at least 8 characters.");
        return;
      }
      const response = await registerAdmin(normalizedEmail, registerPassword);
      setRegisterLoading(false);
      if (!response.success) {
        setRegisterError(response.error?.message ?? "Unable to register admin account.");
        return;
      }
      setRegisterSuccess("OTP sent to your email. Enter it below to verify your admin account.");
      setRegisterStep("verify");
      setDebugOtpHint(response.data?.debugOtp ?? null);
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterLoading(false);
      setRegisterError("Password must be at least 8 characters.");
      return;
    }

    const response = await registerStaff(normalizedEmail, registerPassword);
    setRegisterLoading(false);
    if (!response.success) {
      setRegisterError(response.error?.message ?? "Unable to create staff registration request.");
      return;
    }
    setRegisterSuccess("Request sent to admin. Wait for approval, then enter your 6-digit PIN below.");
    setRegisterStep("verify");
    setDebugOtpHint(null);
  };

  const handleVerifyPin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    if (!/^\d{6}$/.test(verificationPin.trim())) {
      setRegisterError("Enter a valid 6-digit verification PIN.");
      return;
    }
    setRegisterLoading(true);
    const response =
      role === "admin"
        ? await verifyAdminOtp(normalizedEmail, verificationPin.trim())
        : await verifyStaffPin(normalizedEmail, verificationPin.trim());
    setRegisterLoading(false);
    if (!response.success) {
      setRegisterError(response.error?.message ?? "Unable to verify code.");
      return;
    }
    setRegisterSuccess(role === "admin" ? "Admin account verified. You can now sign in." : "Staff account verified. You can now sign in.");
    setRegisterStep("request");
    setDebugOtpHint(null);
    setRegisterPassword("");
    setVerificationPin("");
    setView("login");
  };

  const handleResendAdminOtp = async (): Promise<void> => {
    if (role !== "admin") return;
    setRegisterError(null);
    setRegisterSuccess(null);
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }
    setResendLoading(true);
    const response = await resendAdminOtp(normalizedEmail);
    setResendLoading(false);
    if (!response.success) {
      setRegisterError(response.error?.message ?? "Unable to resend OTP.");
      return;
    }
    setRegisterSuccess("A new OTP was sent to your email.");
    setRegisterStep("verify");
    setDebugOtpHint(response.data?.debugOtp ?? null);
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

          <div className={styles.formWrap}>
            <div className={styles.roleSelector}>
              {(isInternal
                ? [
                    { id: "staff", label: "Staff", icon: "⚙️" },
                    { id: "admin", label: "Admin", icon: "🛡" }
                  ]
                : [{ id: "client", label: "Client", icon: "👤" }]
              ).map((item) => (
                <button
                  key={item.id}
                  className={cx("roleButton", role === item.id && roleConfig[item.id].activeClass)}
                  type="button"
                  onClick={() => handleRoleChange(item.id as LoginRole)}
                >
                  <div className={cx("roleIcon", `roleIcon${capitalize(item.id)}`)}>{item.icon}</div>
                  <span className={styles.roleLabel}>{item.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.stepIndicator}>
              <div className={cx("step", stepStates[view].step1 && `step${capitalize(stepStates[view].step1)}`)} />
              <div className={cx("step", stepStates[view].step2 && `step${capitalize(stepStates[view].step2)}`)} />
            </div>

            <div className={cx("view", view === "login" && "viewActive")}>
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Welcome back</div>
                <div className={styles.formSub}>{activeRole.sub2}</div>
              </div>

              <form onSubmit={handleLogin} noValidate>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="email"
                      className={cx("fieldInput", emailError && "fieldInputError")}
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError(false);
                      }}
                    />
                    <span className={styles.fieldIcon}>✉</span>
                  </div>
                  <span className={cx("fieldError", emailError && "fieldErrorVisible")}>Please enter a valid email address.</span>
                </div>

                {requiresPassword ? (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Password
                      <button className={styles.fieldLink} type="button" onClick={() => setView("forgot")}>Forgot password?</button>
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
                        }}
                      />
                      <button className={styles.fieldIcon} type="button" onClick={() => setShowPassword((prev) => !prev)}>
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                    <span className={cx("fieldError", passwordError && "fieldErrorVisible")}>Password must be at least 8 characters.</span>
                  </div>
                ) : null}

                <div className={styles.optionsRow}>
                  <button className={styles.checkboxWrap} type="button" onClick={() => setRememberMe((prev) => !prev)}>
                    <div className={cx("checkbox", rememberMe && "checkboxChecked")}>{rememberMe ? "✓" : ""}</div>
                    <span className={styles.checkboxLabel}>Keep me signed in</span>
                  </button>
                </div>

                <button className={cx("submitButton", loginLoading && "submitButtonLoading")} type="submit">
                  <span className={styles.submitText}>Sign In →</span>
                  <span className={styles.submitLoader}>
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                  </span>
                </button>
              </form>

              {requiresPassword ? (
                <>
                  <div className={styles.orDivider}>
                    <div className={styles.orLine} />
                    <div className={styles.orText}>or</div>
                    <div className={styles.orLine} />
                  </div>

                  <button className={styles.ssoButton} type="button">
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

              <div className={styles.formFooter}>
                {isInternal ? (
                  <>
                    Need an account?{" "}
                    <button className={styles.inlineLink} type="button" onClick={openRegister}>Register here</button>
                  </>
                ) : (
                  <>Need access? <a href="#">Contact Maphari</a> · <a href="#">Privacy Policy</a></>
                )}
              </div>
            </div>

            <div className={cx("view", view === "forgot" && "viewActive")}>
              <button className={styles.backButton} type="button" onClick={() => setView("login")}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Back to login
              </button>

              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Reset password</div>
                <div className={styles.formSub}>Enter your email and we&apos;ll send a reset link within 2 minutes.</div>
              </div>

              <form onSubmit={handleReset} noValidate>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="email"
                      className={cx("fieldInput", emailError && "fieldInputError")}
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError(false);
                      }}
                    />
                    <span className={styles.fieldIcon}>✉</span>
                  </div>
                  <span className={cx("fieldError", emailError && "fieldErrorVisible")}>Please enter a valid email address.</span>
                </div>

                {resetSuccess ? (
                  <div className={styles.resetSuccess}>✓ Reset link sent. Check your inbox.</div>
                ) : null}

                <button className={cx("submitButton", resetLoading && "submitButtonLoading")} type="submit">
                  <span className={styles.submitText}>Send Reset Link</span>
                  <span className={styles.submitLoader}>
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                  </span>
                </button>
              </form>

              <div className={styles.formFooter} style={{ marginTop: 24 }}>
                Remember it? <button className={styles.inlineLink} type="button" onClick={() => setView("login")}>Back to sign in →</button>
              </div>
            </div>

            <div className={cx("view", view === "register" && "viewActive")}>
              <button className={styles.backButton} type="button" onClick={() => setView("login")}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Back to login
              </button>

              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Register {role === "admin" ? "admin" : "staff"} account</div>
                <div className={styles.formSub}>
                  {role === "admin"
                    ? "Admin registration is restricted by allowlist."
                    : "Staff registration requires admin approval and PIN verification."}
                </div>
              </div>

              {registerStep === "request" ? (
                <form
                  onSubmit={handleRegister}
                  noValidate
                  style={{ opacity: 1, transform: "translateY(0)", transition: "opacity 220ms ease, transform 220ms ease" }}
                >
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email Address</label>
                    <div className={styles.fieldInputWrap}>
                      <input
                        type="email"
                        className={cx("fieldInput", emailError && "fieldInputError")}
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailError(false);
                        }}
                      />
                      <span className={styles.fieldIcon}>✉</span>
                    </div>
                  </div>
                  {role === "admin" || role === "staff" ? (
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Password</label>
                      <div className={styles.fieldInputWrap}>
                        <input
                          type="password"
                          className={styles.fieldInput}
                          placeholder="At least 8 characters"
                          value={registerPassword}
                          onChange={(event) => setRegisterPassword(event.target.value)}
                        />
                        <span className={styles.fieldIcon}>🔐</span>
                      </div>
                    </div>
                  ) : null}
                  {registerError ? <div className={cx("fieldError", "fieldErrorVisible")}>{registerError}</div> : null}
                  {registerSuccess ? <div className={styles.resetSuccess}>{registerSuccess}</div> : null}
                  <button className={cx("submitButton", registerLoading && "submitButtonLoading")} type="submit">
                    <span className={styles.submitText}>{role === "admin" ? "Register & Send OTP" : "Request Staff Access"}</span>
                    <span className={styles.submitLoader}>
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                    </span>
                  </button>
                </form>
              ) : null}

              {registerStep === "verify" && (role === "staff" || role === "admin") ? (
                <form onSubmit={handleVerifyPin} noValidate style={{ marginTop: 14 }}>
                  <div className={styles.resetSuccess}>
                    {role === "admin"
                      ? `Code sent to ${email}. Enter OTP to continue.`
                      : `Request submitted for ${email}. Enter PIN after admin approval.`}
                  </div>
                  {debugOtpHint ? (
                    <div className={styles.resetSuccess}>Dev OTP: <strong>{debugOtpHint}</strong></div>
                  ) : null}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>{role === "admin" ? "Email OTP" : "Verification PIN"}</label>
                    <div className={styles.fieldInputWrap}>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="123456"
                        value={verificationPin}
                        onChange={(event) => setVerificationPin(event.target.value)}
                      />
                      <span className={styles.fieldIcon}>#</span>
                    </div>
                  </div>
                  <button className={cx("submitButton", registerLoading && "submitButtonLoading")} type="submit">
                    <span className={styles.submitText}>{role === "admin" ? "Verify OTP" : "Verify PIN"}</span>
                    <span className={styles.submitLoader}>
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                      <span className={styles.loaderDot} />
                    </span>
                  </button>
                  {registerError ? <div className={cx("fieldError", "fieldErrorVisible")}>{registerError}</div> : null}
                  {role === "admin" ? (
                    <button
                      type="button"
                      className={styles.inlineLink}
                      style={{ marginTop: 10 }}
                      onClick={() => void handleResendAdminOtp()}
                      disabled={resendLoading}
                    >
                      {resendLoading ? "Resending OTP..." : "Resend OTP"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.inlineLink}
                    style={{ marginTop: 10, marginLeft: 12 }}
                    onClick={() => setRegisterStep("request")}
                  >
                    Edit details
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={cx("successOverlay", successOverlay && "successOverlayShow")}>
        <div className={styles.successIcon} style={{ borderColor: activeRole.color, color: activeRole.color }}>✓</div>
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
