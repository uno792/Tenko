import React, { useState } from "react";
import EventFilterBar from "../components/EventsComp/EventFilterBar";
import EventList from "../components/EventsComp/EventList";
import { useUser } from "../Users/UserContext";
import styles from "./EventsPage.module.css";

const EventsPage: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [mode, setMode] = useState<
    "All Events" | "Recommended" | "Urgent Deadlines"
  >("All Events");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (t: string) =>
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Events & Opportunities</h1>

      <EventFilterBar
        mode={mode}
        onMode={setMode}
        tags={[]} // keep empty to use the defaults inside component (or pass your own tag list)
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
      />

      <EventList userId={userId} mode={mode} selectedTags={selectedTags} />
    </div>
  );
};

export default EventsPage;
