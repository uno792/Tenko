import React from "react";
import styles from "./Header.module.css";
import logo from "../../assets/logo.png";
import { Bell, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={logo} alt="Tenko Logo" className={styles.logo} />
      </div>
      <div className={styles.right}>
        <div className={styles.iconWrapper}>
          <Bell className={styles.icon} />
          <span className={styles.notificationBadge}>2</span>
        </div>
        <button className={styles.addButton}>
          <Plus size={20} />
        </button>
        <Link to="/login">
          <button>Login</button>
        </Link>
        <Link to="/signup">
          <button>SignUp</button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
