// src/components/LoginRequiredPanel/LoginRequiredPanel.tsx
import React from "react";
import styles from "./LoginRequiredPanel.module.css";
import GoogleSignUpButton from "../SignupPageComp/Googlesignupbutton"; // adjust path if needed

export default function LoginRequiredPanel() {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Sign in to continue</h2>
      <p className={styles.text}>
        Create an account or sign in with Google to add and track your
        applications.
      </p>
      <div className={styles.actions}>
        <GoogleSignUpButton />
      </div>
    </section>
  );
}
