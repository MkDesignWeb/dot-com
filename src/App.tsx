import { TopBar } from './components/TopBar/TopBar'
import MainRoute from './route/MainRoute'


function App() {

  return (
    <>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        <TopBar />
        <div style={{ flex: 1 }}>
          <MainRoute />
        </div>
      </div>
    </>
  )
}

export default App
