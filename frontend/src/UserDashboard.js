import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserDashboard.css";

// API base URL
const API_URL = process.env.REACT_APP_API_URL;

function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [selectedRating, setSelectedRating] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const token = localStorage.getItem("token");

  // Fetch stores
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/stores`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (storeId) => {
    const ratingValue = selectedRating[storeId];
    const commentValue = comments[storeId] || "";

    if (!ratingValue) {
      alert("Please select a rating!");
      return;
    }

    try {
      setSubmitting({ ...submitting, [storeId]: true });
      
      await axios.post(
        `${API_URL}/ratings`,
        { store_id: storeId, rating: ratingValue, comment: commentValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success feedback
      alert("Rating submitted successfully!");
      
      // Clear form
      setSelectedRating({ ...selectedRating, [storeId]: "" });
      setComments({ ...comments, [storeId]: "" });

      // Refresh stores data
      fetchStores();
    } catch (err) {
      console.error(err);
      alert("Error submitting rating. Please try again.");
    } finally {
      setSubmitting({ ...submitting, [storeId]: false });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload(); // Refresh to go back to login
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Store Ratings Dashboard</h1>
          <p className="header-subtitle">Rate and review your favorite stores</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">{stores.length}</span>
          <span className="stat-label">Total Stores</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {stores.reduce((sum, store) => sum + store.total_ratings, 0)}
          </span>
          <span className="stat-label">Total Reviews</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {stores.filter(store => store.average_rating > 0).length}
          </span>
          <span className="stat-label">Rated Stores</span>
        </div>
      </div>

      <div className="stores-container">
        {stores.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏪</span>
            <h3>No stores available</h3>
            <p>Check back later for new stores to rate!</p>
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                <h3 className="store-name">{store.name}</h3>
                <div className="store-rating">
                  <div className="stars-container">
                    {store.average_rating > 0 ? (
                      <>
                        {renderStars(parseFloat(store.average_rating))}
                        <span className="rating-text">
                          {parseFloat(store.average_rating).toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <>
                        {renderStars(0)}
                        <span className="rating-text no-rating">No ratings yet</span>
                      </>
                    )}
                  </div>
                  <span className="rating-count">({store.total_ratings} reviews)</span>
                </div>
              </div>

              <div className="rating-form">
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  <select
                    className="rating-select"
                    value={selectedRating[store.id] || ""}
                    onChange={(e) => 
                      setSelectedRating({ 
                        ...selectedRating, 
                        [store.id]: Number(e.target.value) 
                      })
                    }
                  >
                    <option value="">Select rating</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {"★".repeat(num)} {num} star{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Comment (Optional)</label>
                  <textarea
                    className="comment-input"
                    placeholder="Share your experience..."
                    value={comments[store.id] || ""}
                    onChange={(e) => 
                      setComments({ 
                        ...comments, 
                        [store.id]: e.target.value 
                      })
                    }
                    rows="3"
                  />
                </div>

                <button 
                  className={`submit-btn ${submitting[store.id] ? 'submitting' : ''}`}
                  onClick={() => handleRatingSubmit(store.id)}
                  disabled={submitting[store.id]}
                >
                  {submitting[store.id] ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="submit-icon">📝</span>
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserDashboard;