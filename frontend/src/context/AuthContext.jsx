import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  me,
} from "../api/auth.api";

// creates a global container to store auth data.
const AuthContext = createContext(null);

// AuthProvider is a component that wraps the app and provides auth data to all children.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stores logged-in user data
  const [booting, setBooting] = useState(true); // App is checking if user is already logged in

  // Load user from cookie on refresh
  // Call me() API Backend checks cookie,If valid → returns user,If not → throws error
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await me();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    };
    init();
  }, []);

  // Login, Register, Logout functions
  const login = async (payload) => {
    const { data } = await loginApi(payload);
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await registerApi(payload);
    setUser(data);
    return data;
  };

  // Backend clears cookie, Frontend clears user
  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
