import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";
import { RouterProvider } from "react-router-dom";
import routes from "./Router/Router.jsx";
import { Provider } from "react-redux";
import store from "./Redux/store.js";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./Provider/AuthProvider.jsx";

// Ensure cross-origin cookies (sessions) are sent with every axios request
axios.defaults.withCredentials = true;

// Ensure cross-origin cookies (sessions) are sent with every fetch request
const originalFetch = window.fetch;
window.fetch = (input, init = {}) => {
  return originalFetch(input, {
    credentials: "include",
    ...init,
  });
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ToastContainer theme="dark" position="top-right" autoClose={3000} />

        <RouterProvider router={routes} />
      </AuthProvider>
    </Provider>
  </StrictMode>
);
