import NotesHeader from "../components/Notes/NotesHeader";
import NotesSearchBar from "../components/Notes/NotesSearchBar";
import NotesCard from "../components/Notes/NotesCard";
import StatsCard from "../components/Notes/StatsCard";
import ContributorsCard from "../components/Notes/ContributorsCard";
import styles from "./notes.module.css";

export default function NotesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <NotesHeader />
        <NotesSearchBar />
        <NotesCard
          title="Mathematics Grade 12 - Calculus Notes"
          subject="Mathematics"
          grade="Grade 12"
          author="John D."
          rating={4.8}
          downloads={245}
          size="2.4 MB"
          date="8/15/2024"
          tag="Notes"
        />
        <NotesCard
          title="Physics - Electricity and Magnetism"
          subject="Physics"
          grade="Grade 12"
          author="Sarah M."
          rating={4.9}
          downloads={189}
          size="1.8 MB"
          date="8/20/2024"
          tag="Notes"
        />
        <NotesCard
          title="Life Sciences Final Exam Paper 2023"
          subject="Life Sciences"
          grade="Grade 12"
          author="Mike K."
          rating={4.7}
          downloads={156}
          size="856 KB"
          date="8/22/2024"
          tag="Past Paper"
        />
      </div>
      <div className={styles.sidebar}>
        <StatsCard />
        <ContributorsCard />
      </div>
    </div>
  );
}
