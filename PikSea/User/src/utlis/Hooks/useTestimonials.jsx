import { useQuery } from "@tanstack/react-query";

const fetchTestimonials = async () => {
  const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/cms/testimonials/getTestimonials.php`, {
    headers: {
      'x-api-key': import.meta.env.VITE_APP_SECRET
    }
  });
  if (!res.ok) {
    throw new Error("Failed to fetch testimonials");
  }
  const data = await res.json();
  return data.data || [];
};

const useTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useTestimonials;
