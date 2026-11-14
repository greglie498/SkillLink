import { BrowserRouter, Routes, Route } from "react-router-dom";
import TalentDashboard from "./pages/TalentDashboard";
import BrowseOpportunities from "./pages/BrowseOpportunities";
import OpportunityDetails from "./pages/OpportunityDetails";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TalentProfile from "./pages/TalentProfile";
import RequireRole from "./components/RequireRole";
import Applications from "./pages/Application";
import ApplyForOpportunity from "./pages/ApplyForOpportunity";
import BusinessOpportunities from "./pages/BusinessOpportunities";
import CreateOpportunity from "./pages/CreateOpportunity";
import OpportunityApplicants from "./pages/OpportunityApplicant";
import AdminAuditLog from "./pages/adminAuditLog";
import BusinessReport from "./pages/BusinessReport";
import BusinessProfile from "./pages/BusinessProfile";
import AdminDashboard from "./pages/AdminDashoard";
import AdminUsers from "./pages/AdminUsers";
import AdminVerification from './pages/AdminVerification';
import AdminOpportunities from './pages/AdminOpportunities';
import AdminAnalytics from './pages/AdminAnalytics';

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
          <Route path="/applications" element={<Applications />} />
          <Route path="/opportunities/:id/apply" element={<ApplyForOpportunity />} />
          <Route path="/profile" element={<TalentProfile />} />
        </Route>

        <Route  element={<RequireRole role="BUSINESS"/>}>
          <Route path="/business" element={<BusinessOpportunities />} />
          <Route path="/business/opportunities/new" element={<CreateOpportunity />} />
          <Route path="/business/opportunities/:id/applicants" element={<OpportunityApplicants />} />
          <Route path="/business/reports" element={<BusinessReport />} />
          <Route path="/business/profile" element={<BusinessProfile />} />
        </Route>

        <Route element={<RequireRole role="ADMIN" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/opportunities" element={<AdminOpportunities />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/audit" element={<AdminAuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;