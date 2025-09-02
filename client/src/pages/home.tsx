import DashboardHeader from "../components/Dashboard/DashboardHeader";
import DeadlineCard from "../components/Dashboard/DeadlineCard";
import EventCard from "../components/Dashboard/EventCard";
import QuickActions from "../components/Dashboard/QuickActions";
import LeaderboardPreview from "../components/Dashboard/LeaderboardPreview";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <DashboardHeader userName="Batman" />

      <div className={styles.dashboardGrid}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Application Deadlines</h2>
            <a href="/applications" className={styles.sectionLink}>
              View All →
            </a>
          </div>
          <DeadlineCard
            uni="UCT"
            course="Computer Science"
            date="15 Sep 2024"
            daysLeft={12}
          />
          <DeadlineCard
            uni="Wits"
            course="Engineering"
            date="30 Sep 2024"
            daysLeft={27}
          />
          <DeadlineCard
            uni="Stellenbosch"
            course="Medicine"
            date="10 Sep 2024"
            daysLeft={7}
            urgent
          />
        </section>

        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
            <a href="/events" className={styles.sectionLink}>
              View All →
            </a>
          </div>
          <EventCard
            title="Google Bursary"
            category="Scholarship"
            date="15 Sep 2024"
            daysLeft={12}
          />
          <EventCard
            title="Youth Hackathon"
            category="Tech Event"
            date="20 Sep 2024"
            daysLeft={17}
            urgent
          />
        </section>
      </div>

      <div className={styles.fullWidth}>
        <QuickActions />
      </div>

      <div className={styles.fullWidth}>
        <LeaderboardPreview />
      </div>
    </div>
  );
}
