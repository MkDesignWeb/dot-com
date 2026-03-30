import { HashRouter, Route, Routes } from "react-router-dom";
import { ConfigPage } from "../pages/ConfigPage";
import { PointRegisterFaceId } from "../pages/PointRegisterFaceId";
import { PointRegisterPassword } from "../pages/PointRegisterPassword";
import { TimePage } from "../pages/TimePage";

function MainRoute() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TimePage />} />
        <Route path="/pointRegister" element={<PointRegisterFaceId />} />
        <Route path="/pointRegister/password" element={<PointRegisterPassword />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </HashRouter>
  );
}

export default MainRoute;
