// ════════ reset-password-screen.tsx — set new password via token link ════════
"use client";

import { useEffect, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import { resetPassword } from "../../lib/api/gateway";
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

function getPasswordStrength(pw: string): { label: string; color: string } {
  if (pw.length === 0) return { label: "", color: "transparent" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  if (pw.length >= 12 && hasUpper && hasLower && hasDigit) {
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

interface ResetPasswordScreenProps {
  token: string;
}

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const strength = getPasswordStrength(password);
  const accentColor = "#a78bfa";
  const accentColorD = "rgba(167,139,250,0.10)";

  // Custom cursor
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0, frameId = 0;
    const moveCursor = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
    };
    const animateRing = () => {
      rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
      frameId = requestAnimationFrame(animateRing);
    };
    document.addEventListener("mousemove", moveCursor);
    animateRing();
    return () => { cancelAnimationFrame(frameId); document.removeEventListener("mousemove", moveCursor); };
  }, []);

  // Parallax orbs
  useEffect(() => {
    const handleParallax = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      if (orbOneRef.current) orbOneRef.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      if (orbTwoRef.current) orbTwoRef.current.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
    };
    document.addEventListener("mousemove", handleParallax);
    return () => document.removeEventListener("mousemove", handleParallax);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setConfirmError(false);

    if (!token) {
      setErrorMessage("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError(true);
      return;
    }

    setLoading(true);
    const response = await resetPassword(token, password);
    setLoading(false);

    if (!response.success) {
      setErrorMessage(response.error?.message ?? "Unable to reset password. The link may have expired.");
      return;
    }

    setSuccess(true);
    // Redirect to login after 3 seconds
    window.setTimeout(() => {
      window.location.href = "/internal-login";
    }, 3000);
  };

  return (
    <div
      className={`${styles.loginRoot} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}
      style={{ "--active": accentColor, "--active-d": accentColorD } as React.CSSProperties}
    >
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} style={{ borderColor: `${accentColor}55` }} />

      <div className={styles.shell}>
        {/* Left panel */}
        <div className={styles.left}>
          <div className={styles.mesh}>
            <div
              ref={orbOneRef}
              className={styles.meshOrb}
              style={{ width: 500, height: 500, top: -120, left: -120, background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)" }}
            />
            <div
              ref={orbTwoRef}
              className={styles.meshOrb}
              style={{ width: 400, height: 400, bottom: -100, right: -100, background: "radial-gradient(circle, rgba(79,158,255,0.08) 0%, transparent 70%)" }}
            />
          </div>

          <div className={styles.cornerDeco}>
            <div className={styles.cornerDecoLine} style={{ width: 48 }} />
            <div className={styles.cornerDecoLine} style={{ width: 32 }} />
            <div className={styles.cornerDecoLine} style={{ width: 20 }} />
          </div>

          <div className={styles.leftContent}>
            <div className={styles.logo}>
              <div className={styles.logoMark} style={{ background: accentColor }}>M</div>
              <div className={styles.logoText}>Maph<span style={{ color: accentColor }}>a</span>ri</div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroEyebrow} style={{ color: accentColor }}>
                <span className={styles.heroEyebrowLine} style={{ background: accentColor }} />
                Password Reset
              </div>
              <h1 className={styles.heroTitle}>
                New password,
                <br />
                <em style={{ color: accentColor }}>fresh start.</em>
              </h1>
              <p className={styles.heroSub}>
                Choose a strong password that you haven&apos;t used before.
                Your account will be secured immediately after reset.
              </p>
            </div>

            <div className={styles.featureList}>
              {[
                { icon: "🔐", text: "Minimum 8 characters", sub: "Use uppercase, numbers & symbols for strength" },
                { icon: "✅", text: "Instant activation", sub: "Sign in immediately after reset" },
                { icon: "🛡", text: "All sessions cleared", sub: "Other devices will be signed out" }
              ].map((feature, index) => (
                <div key={feature.text} className={styles.feature} style={{ animationDelay: `${0.05 + index * 0.07}s` }}>
                  <div className={styles.featureIcon} style={{ background: accentColorD }}>{feature.icon}</div>
                  <div>
                    <div className={styles.featureText}>{feature.text}</div>
                    <div className={styles.featureSub}>{feature.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.roleDesc} style={{ background: accentColor }} />
        </div>

        {/* Right panel — form */}
        <div className={styles.right}>
          <div className={styles.dotGrid}>
            {Array.from({ length: 25 }).map((_, i) => <span key={i} className={styles.dotGridDot} />)}
          </div>

          <div className={styles.formWrap}>
            <a href="/forgot-password" className={styles.backButton} style={{ display: "inline-flex", marginBottom: 28 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Request new link
            </a>

            <div className={styles.formHeader}>
              <div className={styles.formTitle}>Set new password</div>
              <div className={styles.formSub}>Enter your new password below. The link expires in 15 minutes.</div>
            </div>

            {!token ? (
              <div
                className={styles.resetSuccess}
                style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f" }}
              >
                Invalid or missing reset token. Please{" "}
                <a href="/forgot-password" style={{ color: "#ff5f5f" }}>request a new link</a>.
              </div>
            ) : success ? (
              <div className={styles.resetSuccess}>
                ✓ Password updated successfully! Redirecting to sign in…
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>New Password</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="password"
                      className={styles.fieldInput}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <span className={styles.fieldIcon}>🔐</span>
                  </div>
                  {password.length > 0 ? (
                    <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6rem", letterSpacing: "0.08em", color: strength.color, marginTop: 4 }}>
                      Strength: {strength.label}
                    </div>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Confirm New Password</label>
                  <div className={styles.fieldInputWrap}>
                    <input
                      type="password"
                      className={cx("fieldInput", confirmError && "fieldInputError")}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setConfirmError(false);
                      }}
                      onBlur={() => {
                        if (confirmPassword.length > 0) setConfirmError(confirmPassword !== password);
                      }}
                    />
                    <span className={styles.fieldIcon}>🔐</span>
                  </div>
                  <span className={cx("fieldError", confirmError && "fieldErrorVisible")}>Passwords do not match.</span>
                </div>

                {errorMessage ? (
                  <div
                    className={styles.resetSuccess}
                    style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f" }}
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  className={cx("submitButton", loading && "submitButtonLoading")}
                  type="submit"
                  disabled={loading}
                  style={loading ? { opacity: 0.45, pointerEvents: "none" } : undefined}
                >
                  <span className={styles.submitText}>Set New Password →</span>
                  <span className={styles.submitLoader}>
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                    <span className={styles.loaderDot} />
                  </span>
                </button>
              </form>
            )}

            <div className={styles.formFooter} style={{ marginTop: 24 }}>
              Remember it?{" "}
              <a href="/internal-login" style={{ color: accentColor, textDecoration: "none" }}>
                Back to sign in →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
