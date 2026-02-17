import { HashRouter, Routes, Route } from "react-router-dom";
import { TimePage } from "../page/TimePage";
import { PointRegister } from "../page/PointRegister";
import { ConfigPage } from "../page/configPage";

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