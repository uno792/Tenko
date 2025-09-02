import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";

import { Layout } from "./Layout";
import { FindTutor } from "./pages/findtutor";
import PracticePage from "./pages/practice";
import ApplicationsPage from "./pages/ApplicationsPage";
import NotesPage from "./pages/notes"; // <-- new import
import EventPage from "./pages/EventsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/findtutor" element={<FindTutor />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/notes" element={<NotesPage />} /> {/* new route */}
          <Route path="/events" element={<EventPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
