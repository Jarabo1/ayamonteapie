import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RoutesPage from "./pages/Routes";
import RouteDetail from "./pages/RouteDetail";
import MapPage from "./pages/MapPage";
import Walk from "./pages/Walk";
import Stats from "./pages/Stats";
import History from "./pages/History";
import CreateRoute from "./pages/CreateRoute";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rutas" element={<RoutesPage />} />
        <Route path="/rutas/:id" element={<RouteDetail />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/caminar" element={<Walk />} />
        <Route path="/estadisticas" element={<Stats />} />
        <Route path="/historial" element={<History />} />
        <Route path="/crear" element={<CreateRoute />} />
      </Routes>
    </Layout>
  );
}