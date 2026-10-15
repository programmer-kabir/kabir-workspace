import React from 'react'
import Hero from '../components/Home/HeroSection'
import InvestorsHighLight from '../components/Home/InvestorsHighLight'
import { HowSLWorks } from '../components/Home/HowSLWorks'
import InstallmentCalculator from '../components/Home/InstallmentCalculator'
import WhyChooseSL from '../components/Home/WhyChooseSL'
import CtaBanner from '../components/Home/CtaBanner'
import About from '../components/Home/About'
import Testimonials from '../components/Home/Testimonials'
import Contact from '../components/Home/Contact'
import LiveStats from '../components/Home/LiveStats'

const Home = () => {
  return (
    <div>
        <Hero />
      <InvestorsHighLight />
      <HowSLWorks />
      <LiveStats />
      <InstallmentCalculator />
      <WhyChooseSL />
      <CtaBanner />
      <About />
      <Testimonials />
      <Contact />
    </div>
  )
}

export default Home