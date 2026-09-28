/**
 * Google Identity Services (GSI) 1-Click OAuth Client
 * Zero Firebase - Uses official Google GSI SDK
 */

const GOOGLE_GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export const loadGoogleGsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      existingScript.onload = () => resolve(window.google);
      existingScript.onerror = (e) => reject(e);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = GOOGLE_GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google);
    };
    script.onerror = (err) => {
      reject(new Error("Failed to load Google Identity Services SDK: " + err));
    };
    document.head.appendChild(script);
  });
};

/**
 * Triggers Google OAuth2 token flow popup and fetches user profile directly from Google
 */
export const signInWithGooglePopup = async () => {
  await loadGoogleGsiScript();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "464511051660-gjgm0emjlfe3kuhfj581rq2vm7iinmlh.apps.googleusercontent.com";

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          try {
            // Fetch Google User Profile info using the access token
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!userInfoRes.ok) {
              throw new Error("Failed to fetch user info from Google");
            }

            const userInfo = await userInfoRes.json();
            resolve({
              email: userInfo.email,
              name: userInfo.name,
              photo: userInfo.picture,
              sub: userInfo.sub,
              accessToken: tokenResponse.access_token,
            });
          } catch (err) {
            reject(err);
          }
        },
      });

      client.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
};
