import React, { useState } from "react";
import { login } from "./api";
import "./Auth.css"; // Import CSS file

function Login({ setToken }) {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    login(form.email, form.password)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        alert("Login successful!");
      })
      .catch((err) => alert(err.response?.data?.msg || "Login failed"));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">LOGIN</h2>
        <form onSubmit={handleSubmit}>
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
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="auth-btn login-btn">
            SUBMIT
          </button>
        </form>
        <p className="auth-footer">
          Don’t have an account?{" "}
          <a href="/signup" className="auth-link">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;






// import React, { useState } from "react";
// import { login } from "./api";

// function Login({ setToken }) {
//   const [form, setForm] = useState({ email: "", password: "" });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     login(form.email, form.password)
//       .then((res) => {
//         localStorage.setItem("token", res.data.token);
//         setToken(res.data.token);
//         alert("Login successful!");
//       })
//       .catch((err) => alert(err.response.data.msg || "Login failed"));
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /><br/>
//         <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /><br/>
//         <button type="submit">Login</button>
//       </form>
//     </div>
//   );
// }

// export default Login;
