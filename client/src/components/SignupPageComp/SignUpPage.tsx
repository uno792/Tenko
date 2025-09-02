import React from "react";
import GoogleSignUpButton from "./Googlesignupbutton";
import styles from "./SignUpPage.module.css";
import { Link } from "react-router-dom";
const SignUpPage: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background}></div>

      {/* Center Card */}
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoBox}>LOGO</div>

        {/* Welcome */}
        <h1 className={styles.title}>Welcome </h1>
        <p className={styles.subtitle}>Sign up with your Google account</p>

        {/* Login Panel */}
        <div className={styles.loginPanel}>
          <h2 className={styles.panelTitle}>Sign Up</h2>
          <p className={styles.panelSubtitle}>
            Access a personalized learning experience
          </p>

          <GoogleSignUpButton />
        </div>

        {/* Signup */}
        <p className={styles.signupText}>
          have an account?{" "}
          <Link to="/login">
            <a>Login here</a>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
