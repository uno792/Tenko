import { Outlet } from "react-router-dom";
import Header from "./components/Header/Header";
import Navbar from "./components/NavBar";
import styles from "./Layout.module.css";

export function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
