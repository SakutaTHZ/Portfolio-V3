import "./App.css";
import HomeSection from "./layout/HomeSection";
import Compactibility from "./pages/Compactibility"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
    <Router>
      <Routes>
        {/* Define routes */}
        <Route path="/" element={<HomeSection />} />
        <Route path="/ComCheck" element={<Compactibility />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
