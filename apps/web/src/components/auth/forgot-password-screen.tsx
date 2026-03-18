// ════════ forgot-password-screen.tsx — dedicated forgot password page ════════
"use client";

import { useEffect, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import { forgotPassword } from "../../lib/api/gateway";
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).map((name) => styles[name as keyof typeof styles] ?? name).join(" ");
}

export function ForgotPasswordScreen() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbOneRef = useRef<HTMLDivElement>(null);
  const orbTwoRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  // Custom cursor
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Honeypot check
    if (honeypot.length > 0) return;

    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(true);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const response = await forgotPassword(normalizedEmail);
    setLoading(false);

    if (!response.success) {
      setErrorMessage(response.error?.message ?? "Unable to send reset link. Please try again.");
      return;
    }

    setSuccess(true);
  };

  // Purple accent for reset page
  const accentColor = "#a78bfa";
  const accentColorD = "rgba(167,139,250,0.10)";

  return (
    <div
      className={`${styles.loginRoot} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}
      style={
        {
          "--active": accentColor,
          "--active-d": accentColorD
        } as React.CSSProperties
      }
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
              style={{
                width: 500,
                height: 500,
                top: -120,
                left: -120,
                background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)"
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
                background: "radial-gradient(circle, rgba(79,158,255,0.08) 0%, transparent 70%)"
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
              <div className={styles.logoMark} style={{ background: accentColor }}>
                M
              </div>
              <div className={styles.logoText}>
                Maph<span style={{ color: accentColor }}>a</span>ri
              </div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroEyebrow} style={{ color: accentColor }}>
                <span className={styles.heroEyebrowLine} style={{ background: accentColor }} />
                Password Reset
              </div>
              <h1 className={styles.heroTitle}>
                Locked out?
                <br />
                <em style={{ color: accentColor }}>No problem.</em>
              </h1>
              <p className={styles.heroSub}>
                Enter your email address and we&apos;ll send you a secure link to reset your password within 2 minutes.
              </p>
            </div>

            <div className={styles.featureList}>
              {[
                { icon: "🔐", text: "Secure reset link", sub: "Link expires after 15 minutes" },
                { icon: "📧", text: "Email verification", sub: "Sent to your registered address" },
                { icon: "🔄", text: "Instant access", sub: "Sign in immediately after reset" }
              ].map((feature, index) => (
                <div key={feature.text} className={styles.feature} style={{ animationDelay: `${0.05 + index * 0.07}s` }}>
                  <div className={styles.featureIcon} style={{ background: accentColorD }}>
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

          <div className={styles.roleDesc} style={{ background: accentColor }} />
        </div>

        {/* Right panel — form */}
        <div className={styles.right}>
          <div className={styles.dotGrid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={styles.dotGridDot} />
            ))}
          </div>

          <div className={styles.formWrap}>
            <a
              href="/internal-login"
              className={styles.backButton}
              style={{ display: "inline-flex", marginBottom: 28 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Back to sign in
            </a>

            <div className={styles.formHeader}>
              <div className={styles.formTitle}>Reset password</div>
              <div className={styles.formSub}>Enter your email and we&apos;ll send a reset link within 2 minutes.</div>
            </div>

            {success ? (
              <div className={styles.resetSuccess}>
                ✓ Reset link sent. Check your inbox within 2 minutes.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
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

                {errorMessage ? (
                  <div
                    className={styles.resetSuccess}
                    style={{ background: "rgba(255,95,95,0.08)", borderColor: "rgba(255,95,95,0.25)", color: "#ff5f5f" }}
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <button className={cx("submitButton", loading && "submitButtonLoading")} type="submit">
                  <span className={styles.submitText}>Send Reset Link</span>
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
