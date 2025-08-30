import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { axios, setUser } = useAppContext();
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      try {
        const {data } = await axios.post(
          "/api/auth/login",
          { email, password }
        );
        // const data = response.data;
        console.log("API response:", data); // Debug log

        if (data.user && data.user.role) {
          // Set user in context (no token handling)
          if (typeof setUser === 'function') setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("userRole", data.user.role.toString());
          
          // Redirect based on role
          if (data.user.role === 1) {
            navigate("/"); // Admin - Dashboard
          } else if (data.user.role === 2) {
            navigate("/orders"); // Staff - Orders page
          }
        } else {
          setError(data.message || "Login failed");
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("Login failed. Please try again.");
        }
      }
    };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
