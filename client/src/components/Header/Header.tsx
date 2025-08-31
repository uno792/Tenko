import React from "react";
import styles from "./Header.module.css";
import logo from "../../assets/logo.png";
import { Bell, Plus } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={logo} alt="Tenko Logo" className={styles.logo} />
        <h1 className={styles.brand}>TENKO</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.iconWrapper}>
          <Bell className={styles.icon} />
          <span className={styles.notificationBadge}>2</span>
        </div>
        <button className={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
