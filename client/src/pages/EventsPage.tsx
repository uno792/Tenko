import React, { useState } from "react";
import EventFilterBar from "../components/EventsComp/EventFilterBar";
import EventList from "../components/EventsComp/EventList";
import { useUser } from "../Users/UserContext";

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
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "1rem", color: "#8b1c32", fontWeight: 800 }}>
        Events & Opportunities
      </h1>

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
