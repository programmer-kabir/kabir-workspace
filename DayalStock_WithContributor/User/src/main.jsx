import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import axios from "axios";
// Global Fetch Interceptor to attach X-Api-Key
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  const targetUrl = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
  
  if (targetUrl.includes(import.meta.env.VITE_LOCALHOST_KEY)) {
    if (typeof resource === 'string') {
      config = config || {};
      config.headers = {
        ...config.headers,
        'x-api-key': import.meta.env.VITE_APP_SECRET
      };
    } else if (resource instanceof Request) {
      resource.headers.set('x-api-key', import.meta.env.VITE_APP_SECRET);
    }
  }
  return originalFetch(resource, config);
};

// Global Axios Interceptor to attach X-Api-Key
axios.interceptors.request.use(config => {
  if (config.url && config.url.includes(import.meta.env.VITE_LOCALHOST_KEY)) {
    config.headers['x-api-key'] = import.meta.env.VITE_APP_SECRET;
  }
  return config;
});
import { RouterProvider } from "react-router-dom";
import routes from "./Router/Router.jsx";
import AuthProvider from "./Provider/AuthProvider.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "react-loading-skeleton/dist/skeleton.css";

const queryClient = new QueryClient(); 
createRoot(document.getElementById("root")).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>


    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastContainer />
          <RouterProvider router={routes} />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
      </QueryClientProvider>
  </StrictMode>,
);
