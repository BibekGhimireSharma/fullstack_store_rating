import axios from "axios";

const API_URL = "http://localhost:5000";

// Stores & Ratings
export const getStores = () => axios.get(`${API_URL}/stores`);
export const getRatings = (storeId) => axios.get(`${API_URL}/stores/${storeId}/ratings`);
export const submitRating = (storeId, rating, comment, token) => 
  axios.post(`${API_URL}/ratings`, { store_id: storeId, rating, comment }, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Auth
export const signup = (name, email, password, address, role) =>
  axios.post(`${API_URL}/signup`, { name, email, password, address, role });

export const login = (email, password) =>
  axios.post(`${API_URL}/login`, { email, password });
