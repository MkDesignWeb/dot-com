import { HashRouter, Routes, Route } from "react-router-dom";
import { TimePage } from "../page/TimePage";
import { PointRegister } from "../page/PointRegister";


function MainRoute() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TimePage />} />
        <Route path="/pointRegister" element={<PointRegister />} />
      </Routes>
    </HashRouter>
  );
}

export default MainRoute;