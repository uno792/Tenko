import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { Layout } from "./Layout";
import { FindTutor } from "./pages/findtutor";
import PracticePage from "./pages/practice"; // <-- add this import
import ApplicationsPage from "./pages/ApplicationsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/findtutor" element={<FindTutor />} />
          <Route path="/practice" element={<PracticePage />} />{" "}
          <Route path="/applications" element={<ApplicationsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
