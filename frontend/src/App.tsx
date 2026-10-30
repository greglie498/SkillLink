import { BrowserRouter, Routes, Route } from "react-router-dom";
import TalentDashboard from "./pages/TalentDashboard";
import BrowseOpportunities from "./pages/BrowseOpportunities";
import OpportunityDetails from "./pages/OpportunityDetails";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TalentProfile from "./pages/TalentProfile";
import RequireRole from "./components/RequireRole";
import RoleHome from "./pages/RoleHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireRole role="TALENT" />}>
          <Route path="/dashboard" element={<TalentDashboard />} />
          <Route path="/opportunities" element={<BrowseOpportunities />} />
          <Route path="/opportunities/:id" element={<OpportunityDetails />} />
          <Route path="/profile" element={<TalentProfile />} />
        </Route>
        <Route  element={<RequireRole role="BUSINESS"/>}>
          <Route path="/business" element={<RoleHome />} />
        </Route>
        <Route  element={<RequireRole role="ADMIN"/>}>
          <Route path="/admin" element={<RoleHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;