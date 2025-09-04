import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import { UserProvider } from "./Users/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Layout } from "./Layout";
import TutorMartket from "./pages/TutorMarketplace";
import PracticePage from "./pages/practice";
import ApplicationsPage from "./pages/ApplicationsPage";
import NotesPage from "./pages/notes"; // <-- new import
import AIAssistantPage from "./pages/AIAssistantPage";
import EventPage from "./pages/EventsPage";
import LoginPage from "./components/LoginPageComp/LoginPage";
import SignUpPage from "./components/SignupPageComp/SignUpPage";
import ProfilePage from "./pages/Profile";

import CalendarPage from "./components/CalendarPageComp/CalendarPage";
function App() {
  return (
    <GoogleOAuthProvider clientId="719123023157-8iqvisdfo85e23emcfe7gth9vqa7ebop.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/findtutor" element={<TutorMartket />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/notes" element={<NotesPage />} /> {/* new route */}
              <Route path="/events" element={<EventPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Route>
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
