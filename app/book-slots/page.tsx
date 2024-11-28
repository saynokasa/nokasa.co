import HowItWorks from "./components/HowItWorks";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import OrderForm from "./components/OrderForm";
import Hero from "./components/Hero";
import Carousel from "./components/Carousel";
import React from "react";
export default function Home() {
  return (
        <>
        <div className="overflow-hidden">
        <NavBar/>
        <Hero/>
        <HowItWorks/>
        <Carousel/>
        <OrderForm/>
        <Footer/>
        </div>
        </>
  );
}
