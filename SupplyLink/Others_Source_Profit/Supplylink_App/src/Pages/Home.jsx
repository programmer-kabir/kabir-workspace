import React from "react";
import HeroSection from "../components/Home/HeroSection";
import BrandMarquee from "../components/Home/BrandMarquee";
import LiveStats from "../components/Home/LiveStats";
import ProductsShowcase from "../components/Home/ProductsShowcase";
import InstallmentCalculator from "../components/Home/InstallmentCalculator";
import ComparisonTable from "../components/Home/ComparisonTable";
import HowSLWorks from "../components/Home/HowSLWorks";
import InvestorsHighLight from "../components/Home/InvestorsHighLight";
import BusinessModel from "../components/Home/BusinessModel";
import LegalTrustSection from "../components/Home/LegalTrustSection";
import About from "../components/Home/About";
import Testimonials from "../components/Home/Testimonials";
import FaqSection from "../components/Home/FaqSection";
import CtaBanner from "../components/Home/CtaBanner";
import Contact from "../components/Home/Contact";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <BrandMarquee />
      <LiveStats />
      <ProductsShowcase />
      <InstallmentCalculator />
      <ComparisonTable />
      <HowSLWorks />
      <InvestorsHighLight />
      <BusinessModel />
      <LegalTrustSection />
      <About />
      <Testimonials />
      <FaqSection />
      <CtaBanner />
      <Contact />
    </div>
  );
}
