import React, { useState } from "react";
import { signup } from "./api";
import "./Auth.css"; // Import same CSS file

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", address: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(form.name, form.email, form.password, form.address)
      .then(() => alert("Signup successful!"))
      .catch((err) => alert(err.response?.data?.msg || "Error signing up"));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">SIGN UP</h2>
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Name</label>
            <input
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>E-Mail</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>Address</label>
            <input
              placeholder="Enter your address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="auth-btn signup-btn">
            REGISTER
          </button>
        </form>
        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login" className="auth-link">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;








// import React, { useState } from "react";
// import { signup } from "./api";

// function Signup() {
//   const [form, setForm] = useState({ name: "", email: "", password: "", address: "" });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     signup(form.name, form.email, form.password, form.address)
//       .then((res) => alert("Signup successful!"))
//       .catch((err) => alert(err.response.data.msg || "Error signing up"));
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Signup</h2>
//       <form onSubmit={handleSubmit}>
//         <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><br/>
//         <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /><br/>
//         <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /><br/>
//         <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /><br/>
//         <button type="submit">Signup</button>
//       </form>
//     </div>
//   );
// }

// export default Signup;
