import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { Layout } from "./Layout";
import { FindTutor } from "./pages/findtutor";
function App() {
  return (
    <Router>
      <Routes>
        // put within here if you want it to have NavBar
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/findtutor" element={<FindTutor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
