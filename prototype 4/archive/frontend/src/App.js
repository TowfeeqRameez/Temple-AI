import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TempleExperience from "@/pages/TempleExperience";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TempleExperience />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
