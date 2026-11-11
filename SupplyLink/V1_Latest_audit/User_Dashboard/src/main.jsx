import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import routes from './Router/Router.jsx'
import AuthProvider, { AuthContext } from './Provider/AuthProvider.jsx'
import { Provider } from 'react-redux'
import store from './Redux/store.js'
import { ToastContainer } from 'react-toastify'

// Ensure cross-origin cookies (sessions) are sent with every axios request
axios.defaults.withCredentials = true;

// Attach X-User-Id header to every Axios request (fixes cross-site cookie drops on localhost/Brave)
axios.interceptors.request.use(
  (config) => {
    try {
      const saved = localStorage.getItem("investorUser");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          config.headers = config.headers || {};
          config.headers["X-User-Id"] = parsed.id;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ensure cross-origin cookies and auth headers are sent with every fetch request
const originalFetch = window.fetch;
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  try {
    const saved = localStorage.getItem("investorUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.id && !headers.has("X-User-Id")) {
        headers.set("X-User-Id", parsed.id);
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  return originalFetch(input, {
    credentials: "include",
    ...init,
    headers,
  });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Provider store={store}>
        <ToastContainer />
        <RouterProvider router={routes}/>
      </Provider>
    </AuthProvider>
  </StrictMode>,
)
