import React, { useState } from "react";
import EventFilterBar from "../components/EventsComp/EventFilterBar";
import EventList from "../components/EventsComp/EventList";

const EventPage: React.FC = () => {
  const [filter, setFilter] = useState("All Events");

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "1rem" }}>Applications & Events</h1>
      <EventFilterBar selected={filter} onSelect={setFilter} />
      <EventList filter={filter} />
    </div>
  );
};

export default EventPage;
