import { HashRouter, Route, Routes } from "react-router-dom";
import { ConfigPage } from "../pages/ConfigPage";
import { PointRegister } from "../pages/PointRegister";
import { TimePage } from "../pages/TimePage";

function MainRoute() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TimePage />} />
        <Route path="/pointRegister" element={<PointRegister />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </HashRouter>
  );
}

export default MainRoute;
