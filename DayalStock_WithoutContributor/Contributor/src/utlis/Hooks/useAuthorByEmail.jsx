import { useQuery } from "@tanstack/react-query";

const getAuthorByEmail = async (email) => {
  if (!email?.trim()) {
    throw new Error("Author email is required");
  }

  const url = `${
    import.meta.env.VITE_LOCALHOST_KEY
  }/author/get_author.php?email=${encodeURIComponent(email.trim())}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Author load failed");
  }

  return data.data[0] || null;
};

const useAuthorByEmail = (email) => {
  return useQuery({
    queryKey: ["authorByEmail", email],
    queryFn: () => getAuthorByEmail(email),
    enabled: Boolean(email?.trim()),
    staleTime: 1000 * 60 * 5,
  });
};

export default useAuthorByEmail;