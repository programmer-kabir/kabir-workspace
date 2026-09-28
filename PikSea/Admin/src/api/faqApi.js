import { authFetch } from "./authFetch";

const API_URL = `${import.meta.env.VITE_LOCALHOST_KEY}/cms/faqs/admin.php`;

export const getFaqs = async (type = 'faq') => {
  const url = `${API_URL}?type=${type}`;
  const res = await authFetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
};

export const createFaq = async (faqData, type = 'faq') => {
  const url = `${API_URL}?type=${type}`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(faqData),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

export const updateFaq = async (faqData, type = 'faq') => {
  const url = `${API_URL}?type=${type}`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(faqData),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

export const deleteFaq = async (id, type = 'faq') => {
  const url = `${API_URL}?type=${type}`;
  const res = await authFetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};
