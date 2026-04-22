import React from "react";
import Home from "./Home";
import AppCarousel from "./AppCarousel";
import Services from "./Services";
import Contact from "./Contact";

const Landing: React.FC = () => (
  <>
    <Home />
    <AppCarousel />
    <Services />
    <Contact />
  </>
);

export default Landing;
