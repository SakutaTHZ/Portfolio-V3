import "./App.css";
import Nav from "./components/Nav";
import HomeSection from "./layout/HomeSection";
import { BrowserView, MobileView } from "react-device-detect";

function App() {
  return (
    <>
    
    <Nav />
      <BrowserView>
        <HomeSection />
      </BrowserView>

      
      <MobileView>
      </MobileView>
    </>
  );
}

export default App;
