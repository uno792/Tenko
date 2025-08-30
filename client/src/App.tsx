import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { Layout } from "./Layout";
import { FindTutor } from "./pages/findtutor";
import PracticePage from "./pages/practice"; // <-- add this import

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes that use the Layout (with NavBar, Header, etc.) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/findtutor" element={<FindTutor />} />
          <Route path="/practice" element={<PracticePage />} />{" "}
          {/* <-- add this */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
