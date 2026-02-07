import { HashRouter, Routes, Route, Link } from "react-router-dom";


function MainRoute() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<h1>DOT COM</h1>} />
      </Routes>
    </HashRouter>
  );
}

export default MainRoute;