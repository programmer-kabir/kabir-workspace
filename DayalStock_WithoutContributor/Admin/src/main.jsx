import { StrictMode } from "react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import routes from "./Router/Router.jsx";
import AuthProvider from "./Provider/AuthProvider.jsx";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ----------------------------------------------------
// 1. Global Fetch Interceptor
// ----------------------------------------------------
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  
  // Extract resource URL
  const targetUrl = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
  
  // Only add key for specified API
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

// ----------------------------------------------------
// 2. Global Axios Interceptor
// ----------------------------------------------------
axios.interceptors.request.use(config => {
  // Only intercept specified API URL
  if (config.url && config.url.includes(import.meta.env.VITE_LOCALHOST_KEY)) {
    config.headers['x-api-key'] = import.meta.env.VITE_APP_SECRET;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const queryClient = new QueryClient(); 
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <ToastContainer />
        <RouterProvider router={routes} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
