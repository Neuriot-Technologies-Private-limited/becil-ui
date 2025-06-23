import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdMasters from "@views/AdMasters.js";
import Broadcasts from "@views/Broadcasts";
import Login from "@views/Login";
import Parent from "@layouts/Parent";
import "/src/App.css"

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={<Parent />}>
            <Route path="/broadcasts" element={<Broadcasts />} />
            <Route path="/admasters" element={<AdMasters />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </>
  );
}
