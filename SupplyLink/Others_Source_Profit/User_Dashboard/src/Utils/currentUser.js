import Loader from "../components/Loader/Loader";
import useAuth from "./Hooks/useAuth";
import useUsers from "./Hooks/useUsers";

const useCurrentUser = () => {
  const { user } = useAuth();
  const { users } = useUsers();

  if (!user) {
    return null;
  }

  const foundUser = Array.isArray(users)
    ? users.find((u) => String(u.id) === String(user.id))
    : null;

  return foundUser || user;
};

export default useCurrentUser;
