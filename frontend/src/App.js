import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import AdminDashboard from "./AdminDashboard";
import OwnerDashboard from "./OwnerDashboard";
import UserDashboard from "./UserDashboard";

// API base URL
const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [stores, setStores] = useState([]);
  const [selectedRating, setSelectedRating] = useState({});
  const [comments, setComments] = useState({});
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", address: "" });
  const [isSignup, setIsSignup] = useState(false);


  // Fetch stores...>
  useEffect(() => {
    if (token) fetchStores();
  }, [token]);

  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRatingSubmit = async (storeId) => {
    const ratingValue = selectedRating[storeId];
    const commentValue = comments[storeId] || "";

    if (!ratingValue) return alert("Please select a rating!");

    try {
      await axios.post(
        `${API_URL}/ratings`,
        { store_id: storeId, rating: ratingValue, comment: commentValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Rating submitted!");
      setSelectedRating({ ...selectedRating, [storeId]: "" });
      setComments({ ...comments, [storeId]: "" });

      const res = await axios.get(`${API_URL}/stores`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
      alert("Error submitting rating");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await axios.post(`${API_URL}/signup`, authForm);
        alert("Signup successful! Please login.");
        setIsSignup(false);
        setAuthForm({ name: "", email: "", password: "", address: "" });
      } else {
        const res = await axios.post(`${API_URL}/login`, {
          email: authForm.email,
          password: authForm.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        setToken(res.data.token);
        setUserRole(res.data.user.role);
        alert("Login successful!");
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setUserRole(null);
  };

  if (!token) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignup ? "Signup" : "Login"}</h2>
        <form onSubmit={handleAuthSubmit}>
          {isSignup && (
            <>
              <input
                className="auth-input"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
              />
              <input
                className="auth-input"
                placeholder="Address"
                value={authForm.address}
                onChange={(e) =>
                  setAuthForm({ ...authForm, address: e.target.value })
                }
              />
            </>
          )}
          <input
            className="auth-input"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) =>
              setAuthForm({ ...authForm, email: e.target.value })
            }
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) =>
              setAuthForm({ ...authForm, password: e.target.value })
            }
          />
          <button className="auth-btn" type="submit">
            {isSignup ? "Signup" : "Login"}
          </button>
        </form>
        <button
          className="switch-btn"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? "Switch to Login" : "Switch to Signup"}
        </button>
      </div>
    </div>
  );
}


  return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Store Ratings</h1>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {userRole === "admin" && <AdminDashboard token={token} />}
        {userRole === "owner" && <OwnerDashboard token={token} />}
        {userRole === "normal" && <UserDashboard />}

      </div>

  );
} 

export default App;
