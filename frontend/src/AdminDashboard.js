

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = process.env.REACT_APP_API_URL;

function AdminDashboard({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]); // NEW: For store assignment
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", address: "", role: "normal" });
  const [storeForm, setStoreForm] = useState({ name: "", address: "" });

  const [userFilter, setUserFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  // NEW: Simple forms for new functionality
  const [passwordChange, setPasswordChange] = useState({ userId: "", newPassword: "" });
  const [storeAssign, setStoreAssign] = useState({ storeId: "", ownerId: "" });

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

  // Fetch users and stores simultaneously
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, storesRes, ownersRes] = await Promise.all([
          axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/admin/stores-with-owners`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/admin/owners`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setUsers(usersRes.data);
        setStores(storesRes.data);
        setOwners(ownersRes.data);

        const totalRatings = storesRes.data.reduce((acc, s) => acc + (s.total_ratings || 0), 0);
        setStats({
          totalUsers: usersRes.data.length,
          totalStores: storesRes.data.length,
          totalRatings,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/create-user`, userForm, { headers: { Authorization: `Bearer ${token}` } });
      setUsers([...users, res.data]);
      setUserForm({ name: "", email: "", password: "", address: "", role: "normal" });
      setStats({ ...stats, totalUsers: stats.totalUsers + 1 });
      alert(`User "${res.data.name}" created successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  // Create store
  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/create-store`, storeForm, { headers: { Authorization: `Bearer ${token}` } });
      setStores([...stores, res.data]);
      setStoreForm({ name: "", address: "" });
      setStats({ ...stats, totalStores: stats.totalStores + 1 });
      alert(`Store "${res.data.name}" created successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  // NEW: Change user password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/admin/change-user-password`, passwordChange, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.msg);
      setPasswordChange({ userId: "", newPassword: "" });
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  // NEW: Assign store to owner
  const handleAssignStore = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/admin/assign-store`, storeAssign, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.msg);
      setStoreAssign({ storeId: "", ownerId: "" });
      // Refresh stores
      const storesRes = await axios.get(`${API_URL}/admin/stores-with-owners`, { headers: { Authorization: `Bearer ${token}` } });
      setStores(storesRes.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.address.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.role.toLowerCase().includes(userFilter.toLowerCase())
  );

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(storeFilter.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(storeFilter.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(storeFilter.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card"><h3>Total Users</h3><p>{stats.totalUsers}</p></div>
        <div className="stat-card"><h3>Total Stores</h3><p>{stats.totalStores}</p></div>
        <div className="stat-card"><h3>Total Ratings</h3><p>{stats.totalRatings}</p></div>
      </div>

      {/* Forms */}
      <div className="forms-section">
        <div className="form-card">
          <h3>Add New User</h3>
          <form onSubmit={handleCreateUser}>
            <input placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            <input placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <input placeholder="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            <input placeholder="Address" value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
            <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Create User</button>
          </form>
        </div>

        <div className="form-card">
          <h3>Add New Store</h3>
          <form onSubmit={handleCreateStore}>
            <input placeholder="Name" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} />
            <input placeholder="Address" value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} />
            <button type="submit">Create Store</button>
          </form>
        </div>

        {/* NEW: Change Password Form */}
        <div className="form-card">
          <h3>Change User Password</h3>
          <form onSubmit={handleChangePassword}>
            <select value={passwordChange.userId} onChange={(e) => setPasswordChange({ ...passwordChange, userId: e.target.value })} required>
              <option value="">Select User</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            <input 
              type="password" 
              placeholder="New Password" 
              value={passwordChange.newPassword}
              onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
              required
            />
            <button type="submit">Change Password</button>
          </form>
        </div>

        {/* NEW: Assign Store Form */}
        <div className="form-card">
          <h3>Assign Store to Owner</h3>
          <form onSubmit={handleAssignStore}>
            <select value={storeAssign.storeId} onChange={(e) => setStoreAssign({ ...storeAssign, storeId: e.target.value })} required>
              <option value="">Select Store</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.owner_name ? `(${s.owner_name})` : '(Unassigned)'}
                </option>
              ))}
            </select>
            <select value={storeAssign.ownerId} onChange={(e) => setStoreAssign({ ...storeAssign, ownerId: e.target.value })} required>
              <option value="">Select Owner</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
            </select>
            <button type="submit">Assign Store</button>
          </form>
        </div>
      </div>

      {/* Users List */}
      <div className="lists-section">
        <div className="list-card">
          <h3>All Users</h3>
          <input placeholder="Filter Users" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Address</th><th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stores List */}
        <div className="list-card">
          <h3>All Stores</h3>
          <input placeholder="Filter Stores" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} />
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Location</th><th>Rating</th><th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.address || s.location || "-"}</td>
                  <td>{s.average_rating != null ? Number(s.average_rating).toFixed(1) : "No ratings"}</td>
                  <td>{s.owner_name || "Not Assigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;