import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './Layout/Layout.jsx';
import Home from './Pages/Home.jsx';
import InstallmentRules from './Pages/InstallmentRules.jsx';
import InvestorsGuide from './Pages/InvestorsGuide.jsx';
import { Toaster } from 'react-hot-toast';
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children:[
      {
        path:"/",
        element:<Home />
      },
      {
        path:"/installment-rules",
        element:<InstallmentRules />
      },
      {
        path:"/investors",
        element:<InvestorsGuide />
      }
    ]
  },
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Toaster position="top-right" />
     <RouterProvider router={router} />
  </StrictMode>,
)
