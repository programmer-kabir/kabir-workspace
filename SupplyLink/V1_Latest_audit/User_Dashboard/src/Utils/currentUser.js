import useAuth from "./Hooks/useAuth";

const useCurrentUser = () => {
  const { user } = useAuth();
  return user || null;
};

export default useCurrentUser;
