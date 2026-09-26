/**
 * Pure Google Identity Services (GSI) Helper — 100% Zero Firebase
 * Uses official Google OAuth2 popup client directly from accounts.google.com
 */

const loadGsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Could not load Google authentication service"));
    document.head.appendChild(script);
  });
};

/**
 * Open official Google 1-Click popup dialog and return verified user profile
 * @param {string} [customClientId]
 * @returns {Promise<{ email: string, name: string, photo: string, sub: string }>}
 */
export const signInWithGooglePopup = (customClientId) => {
  const clientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return new Promise(async (resolve, reject) => {
    try {
      await loadGsiScript();

      if (!window.google?.accounts?.oauth2) {
        throw new Error("Google authentication library not available");
      }

      if (!clientId) {
        throw new Error("Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in .env");
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error || "Google login cancelled"));
            return;
          }

          try {
            // Fetch verified user profile directly from Google
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            
            if (!userRes.ok) {
              throw new Error("Failed to fetch Google profile details");
            }

            const profile = await userRes.json();

            resolve({
              email: profile.email,
              name: profile.name || profile.given_name || "",
              photo: profile.picture || "",
              sub: profile.sub
            });
          } catch (fetchErr) {
            reject(fetchErr);
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || "Google popup encountered an error"));
        }
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });

    } catch (err) {
      reject(err);
    }
  });
};
