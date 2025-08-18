import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerDashboard.css";
import { useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL;

function OwnerDashboard({ token, onLogout }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Password change functionality
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // NEW: Stats
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatings: 0,
    averageRating: 0
  });

  // Logout functionality
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      // If onLogout function is provided, call it, otherwise reload the page
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      } else {
        // Fallback: reload the page to redirect to login
        window.location.reload();
      }
    }
  };

  // Fetch stores of logged-in owner with ratings
const fetchStoresAndRatings = useCallback(async () => {
  try {
    const res = await axios.get(`${API_URL}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    setStores(res.data);
    
    // Calculate stats
    const totalRatings = res.data.reduce(
      (acc, store) => acc + (store.ratings?.length || 0),
      0
    );
    const totalRatingSum = res.data.reduce((acc, store) => {
      const storeRatings = store.ratings || [];
      return acc + storeRatings.reduce((sum, r) => sum + r.rating, 0);
    }, 0);
    
    setStats({
      totalStores: res.data.length,
      totalRatings,
      averageRating: totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(1) : 0,
    });
    
  } catch (err) {
    console.error(err);
    alert("Error fetching dashboard data");
  } finally {
    setLoading(false);
  }
}, [token]); 


  // NEW: Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      const res = await axios.put(`${API_URL}/owner/update-password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(res.data.msg);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert(err.response?.data?.msg || "Error changing password");
    }
  };

useEffect(() => {
  fetchStoresAndRatings();
}, [token, fetchStoresAndRatings]);


  if (loading) return <div className="loading">Loading owner dashboard...</div>;

  return (
    <div className="owner-container">
      <header className="owner-header">
        <div className="header-content">
          <h1>Owner Dashboard</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.totalStores}</span>
            <span className="stat-label">My Stores</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalRatings}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.averageRating}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
      </header>

      {/* NEW: Password Change Section */}
      <div className="password-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange} className="password-form">
          <input
            type="password"
            placeholder="Current Password"
            value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            minLength="6"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            minLength="6"
          />
          <button type="submit">Update Password</button>
        </form>
      </div>

      {/* Improved Stores Section */}
      <div className="stores-section">
        <h3>My Stores & Reviews</h3>
        {stores.length === 0 ? (
          <div className="no-stores">
            <p>No stores assigned to you yet. Contact admin to assign stores.</p>
          </div>
        ) : (
          stores.map((store) => {
            const storeRatings = store.ratings || [];
            const avgRating = store.average_rating || 0;

            return (
              <div key={store.id} className="store-card">
                <div className="store-header">
                  <h2>{store.name}</h2>
                  <div className="store-rating">
                    <span className="rating-number">{avgRating > 0 ? Number(avgRating).toFixed(1) : '0.0'}</span>
                    <span className="rating-stars">{'★'.repeat(Math.round(avgRating))}</span>
                  </div>
                </div>
                
                <div className="store-info">
                  {/* <p><strong> Location:</strong> {store.address || store.location|| "No address provided"}</p> */}
                  <p><strong> Total Reviews:</strong> {storeRatings.length}</p>
                </div>

                {storeRatings.length > 0 ? (
                  <div className="ratings-section">
                    <h4>Customer Reviews</h4>
                    <div className="ratings-table-container">
                      <table className="ratings-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Review</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeRatings.map((rating) => (
                            <tr key={rating.id || rating.user_id}>
                              <td className="customer-name">
                                <strong>{rating.user_name || rating.name || "Anonymous"}</strong>
                                <br />
                                <small>{rating.email || ""}</small>
                              </td>
                              <td className="rating-cell">
                                <span className="rating-stars">{'★'.repeat(rating.rating)}</span>
                                <span className="rating-number">({rating.rating}/5)</span>
                              </td>
                              <td className="comment-cell">
                                {rating.comment || <em>No comment</em>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="no-ratings">
                    <p> No reviews yet. Encourage customers to rate your store!</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
