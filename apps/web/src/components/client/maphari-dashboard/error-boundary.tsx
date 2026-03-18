// ════════════════════════════════════════════════════════════════════════════
// error-boundary.tsx — Dashboard error boundary
// Catches render-phase errors from any page child and shows a friendly
// error card instead of a blank/crashed screen.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { cx } from "./style";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  /** The page / section to render normally */
  children: ReactNode;
  /** Optional page label shown in the error card title */
  pageName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Structured log for observability (picked up by browser devtools / APM)
    console.error("[DashboardErrorBoundary]", {
      error: error.message,
      stack: error.stack,
      component: info.componentStack
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const label = this.props.pageName ?? "this page";

    return (
      <div className={cx("errorState")}>
        <div className={cx("errorStateIcon")}>⚠️</div>
        <p className={cx("errorStateTitle")}>Something went wrong on {label}</p>
        <p className={cx("errorStateSub")}>{this.state.message}</p>
        <button
          onClick={this.handleRetry}
          style={{
            marginTop: 12,
            padding: "6px 16px",
            fontSize: "0.78rem",
            fontWeight: 600,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            color: "#ef4444",
            cursor: "pointer"
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
