import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const name = method === "login" ? "Login" : "Signup";

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const requestData =
      method === "signup"
        ? { username, password, email }
        : { username, password };

    try {
      const res = await api.post(route, requestData);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        alert(
          "Signup successful! Please check your email to verify your account.",
        );
        navigate("/login");
      }
    } catch (error) {
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-slate-200">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-around items-center bg-slate-50 h-2/3 w-1/3 rounded-2xl shadow-2xl p-4"
      >
        <h1 className="m-4 text-3xl">{name}</h1>

        <input
          type="text"
          value={username}
          className="hover:border-blue-400 hover:border-2 rounded-md outline-1 p-1 w-3/4 focus:outline-blue-400 focus:outline-2"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />

        {method === "signup" && (
          <input
            type="email"
            value={email}
            className="hover:border-blue-400 hover:border-2 rounded-md outline-1 p-1 w-3/4 focus:outline-blue-400 focus:outline-2"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
          />
        )}

        <div className="flex items-center w-3/4 bg-white border-2 border-slate-200 rounded-md transition-all focus-within:border-blue-400 hover:border-blue-400">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="grow p-2 outline-none bg-transparent"
            placeholder="Password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="px-3 text-xs font-semibold text-blue-400 hover:text-blue-600 transition-colors"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        <button
          className="hover:cursor-pointer bg-blue-400 rounded-md text-white w-1/2 h-10 disabled:bg-blue-200"
          type="submit"
          disabled={loading}
        >
          {loading ? "Processing..." : name}
        </button>
        <p className="text-sm mt-4">
          {method === "signup" ? (
            <>
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-500 hover:underline font-semibold"
              >
                Login
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-500 hover:underline font-semibold"
              >
                Register
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export default Form;
