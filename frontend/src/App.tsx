import { BrowserRouter, Routes, Route } from "react-router-dom";
import TalentDashboard from "./pages/TalentDashboard";
import BrowseOpportunities from "./pages/BrowseOpportunities";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TalentDashboard />} />
        <Route path="/opportunities" element={<BrowseOpportunities />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;