import { getAuthToken, setAuthToken, authFetch } from "./authFetch";

const API_URL = import.meta.env.VITE_LOCALHOST_KEY;

const authHeaders = {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
};

export const loginUserApi = async ({ email, password }) => {
  const res = await fetch(`${API_URL}/internal-auth/login.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const error = new Error(data.message || "Login failed");
    error.needs_verification = data.needs_verification;
    error.email = data.email;
    throw error;
  }
  return data;
};

export const googleLoginApi = async ({ email, name, photo }) => {
  const res = await fetch(`${API_URL}/internal-auth/google_login.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, name, photo }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Google Login failed");
  }
  return data;
};

export const getMeApi = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/internal-auth/me.php`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
};

export const verifyOtpApi = async ({ email, code, type = "password_reset" }) => {
  const res = await fetch(`${API_URL}/internal-auth/verify_otp.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, code, type }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Verification failed");
  }
  return data;
};

export const resendOtpApi = async ({ email, type = "password_reset" }) => {
  const res = await fetch(`${API_URL}/internal-auth/resend_otp.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, type }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to resend code");
  }
  return data;
};

export const forgotPasswordApi = async ({ email }) => {
  const res = await fetch(`${API_URL}/internal-auth/forgot_password.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Password reset request failed");
  }
  return data;
};

export const resetPasswordApi = async ({ email, code, new_password }) => {
  const res = await fetch(`${API_URL}/internal-auth/reset_password.php`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, code, new_password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Password reset failed");
  }
  return data;
};
