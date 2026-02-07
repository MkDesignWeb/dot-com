import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { TimePage } from "../page/TimePage";


function MainRoute() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TimePage />} />
      </Routes>
    </HashRouter>
  );
}

export default MainRoute;