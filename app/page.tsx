import NavBar from "./components/home/NavBar";
import Hero from "./components/home/Hero";
import Footer from './components/common/Footer';
import Benefits from './components/home/Benefits';
import Partner from './components/home/Partner';
import HowItWorks from './components/home/HowItWorks';
import Contact from './components/home/Contact';
import Recycle from './components/home/Recycle';

export default function Home() {
  return (
    <>
      <div className="overflow-hidden max-w-[1920px] m-auto bg-[#f7f6f1]">
        <NavBar />
        <Hero />
        <Recycle />
        <Partner />
        <Benefits />
        <HowItWorks />
        <Contact />
        <Footer/>
      </div>
    </>
  );
}
