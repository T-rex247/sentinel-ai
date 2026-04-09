import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Alerts from "./pages/Alerts";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
    </Routes>
  );
}
