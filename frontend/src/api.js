import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// Stores & Ratings
export const getStores = () => API.get("/stores");

export const getRatings = (storeId) =>
  API.get(`/stores/${storeId}/ratings`);

export const submitRating = (storeId, rating, comment, token) =>
  API.post(
    "/ratings",
    { store_id: storeId, rating, comment },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

// Auth
export const signup = (name, email, password, address, role) =>
  API.post("/signup", { name, email, password, address, role });

export const login = (email, password) =>
  API.post("/login", { email, password });
