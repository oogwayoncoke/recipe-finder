import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    // Postman works because it sends 'username'. We must do the same.
    const response = await axios.post(
      "http://127.0.0.1:8000/authentication/token/",
      {
        username: email,
        password: password,
      },
    );

    const { access, refresh } = response.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    // Decode token to get user info
    const payload = JSON.parse(atob(access.split(".")[1]));
    const userData = { uuid: payload.user_id, email };
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    return axios.post(
      "http://127.0.0.1:8000/authentication/register/",
      userData,
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) setUser({ loggedIn: true });
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
