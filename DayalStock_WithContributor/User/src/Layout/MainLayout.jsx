import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useAnalyticsTracking } from "../utlis/Hooks/useAnalyticsTracking"

const MainLayout = () => {
  useAnalyticsTracking(); // Auto track analytics globally

  return (
    <div>
        <Navbar />
        <Outlet />
        <Footer />
    </div>
  )
}

export default MainLayout