import React from "react";
import GoogleLogInButton from "./Googleloginbutton";
import styles from "./LoginPage.module.css";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png"; // adjust relative path

const LoginPage: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background}></div>

      {/* Center Card */}
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoBox}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        {/* Welcome */}
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Sign in to your academic dashboard with your Google account
        </p>

        {/* Login Panel */}
        <div className={styles.loginPanel}>
          <h2 className={styles.panelTitle}>Sign In</h2>
          <p className={styles.panelSubtitle}>
            Access your personalized learning experience
          </p>

          <GoogleLogInButton />
        </div>

        {/* Signup */}
        <p className={styles.signupText}>
          Don’t have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
