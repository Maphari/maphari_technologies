"use client";

import { FormEvent, useState } from "react";
import styles from "../../app/style/workspace.module.css";

interface SignInPanelProps {
  loading: boolean;
  onSignIn: (email: string) => Promise<boolean>;
}

export function SignInPanel({ loading, onSignIn }: SignInPanelProps) {
  const [email, setEmail] = useState("client@example.com");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSignIn(email);
  }

  return (
    <section className={styles.authCard}>
      <h2>Sign in</h2>
      <p>Use your account email to authenticate via the gateway auth flow.</p>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
