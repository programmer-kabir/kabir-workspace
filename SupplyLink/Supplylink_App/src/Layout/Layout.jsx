import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Share/Navbar'
import Footer from '../components/Share/Footer'

const Layout = () => {
  return (
    <div>
        <Navbar />
        <Outlet />
        <Footer />
    </div>
  )
}

export default Layout