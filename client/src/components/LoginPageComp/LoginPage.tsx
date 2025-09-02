import React from "react";
import GoogleLogInButton from "./Googleloginbutton";
import styles from "./LoginPage.module.css";
import { Link } from "react-router-dom";

const LoginPage: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background}></div>

      {/* Center Card */}
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoBox}>LOGO</div>

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
          Dont have an account?{" "}
          <Link to="/signup">
            <a>SignUp here</a>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
