const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

require("dotenv").config();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ msg: "Invalid token" });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };



// User Signup

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ msg: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role",
      [name, email, hashedPassword, address, role || "normal"]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


// User Login

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ msg: "Invalid credentials" });

    const validPass = await bcrypt.compare(password, user.rows[0].password);
    if (!validPass) return res.status(400).json({ msg: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Admin resets any user's password
app.post("/admin-reset-password", authenticateToken, async (req, res) => {
  const { email, newPassword } = req.body;
  const adminId = req.user.id; // from auth middleware

  try {
    const adminCheck = await pool.query("SELECT role FROM users WHERE id=$1", [adminId]);
    if (adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ msg: "Only admin can reset passwords" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE users SET password=$1 WHERE email=$2 RETURNING id, email",
      [hashed, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ msg: `Password reset for ${result.rows[0].email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});




// Get ratings for a store

app.get("/stores/:id/ratings", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM ratings WHERE store_id = $1 ORDER BY created_at DESC",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
  }
});


// Get all stores with current ratings

app.get("/stores", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name,address,location, average_rating, total_ratings FROM stores ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});



// ==========================
// Admin: Create a new user  
// ==========================
app.post("/admin/create-user", async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Check if requester is admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") return res.status(403).json({ msg: "Access denied" });

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0)
      return res.status(400).json({ msg: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role",
      [name, email, hashedPassword, address, role || "normal"]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// Define verifyToken function first
function verifyToken(allowedRoles) {
  return (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Access denied" });
      }
      req.user = decoded;
      next();
    });
  };
}


// Add or update a rating
app.post("/ratings", verifyToken(["normal", "owner", "admin"]), async (req, res) => {
  try {
    const userId = req.user.id; // comes from JWT
    const { store_id, rating, comment } = req.body;

    if (!store_id || !rating) {
      return res.status(400).json({ msg: "store_id and rating are required" });
    }

    // Check if user already rated this store
    const existing = await pool.query(
      "SELECT * FROM ratings WHERE user_id = $1 AND store_id = $2",
      [userId, store_id]
    );

    if (existing.rows.length > 0) {
      // Update existing rating
      await pool.query(
        "UPDATE ratings SET rating=$1, comment=$2, updated_at=NOW() WHERE user_id=$3 AND store_id=$4",
        [rating, comment, userId, store_id]
      );
    } else {
      // Insert new rating
      await pool.query(
        "INSERT INTO ratings (store_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
        [store_id, userId, rating, comment]
      );
    }

    // Recalculate average rating & total ratings
    const result = await pool.query(
      "SELECT AVG(rating)::numeric(10,2) AS average_rating, COUNT(*) AS total_ratings FROM ratings WHERE store_id=$1",
      [store_id]
    );

    await pool.query(
      "UPDATE stores SET average_rating=$1, total_ratings=$2 WHERE id=$3",
      [result.rows[0].average_rating, result.rows[0].total_ratings, store_id]
    );

    res.json({ msg: "Rating submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Admin: Create a new store

app.post("/admin/create-store", async (req, res) => {
  try {
    const { name, email, address } = req.body;

    // Check if requester is admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") return res.status(403).json({ msg: "Access denied" });

    // Check if store already exists
    const existingStore = await pool.query("SELECT * FROM stores WHERE name = $1", [name]);
    if (existingStore.rows.length > 0) return res.status(400).json({ msg: "Store already exists" });

    // Insert store
    const newStore = await pool.query(
    "INSERT INTO stores (name, location) VALUES ($1, $2) RETURNING *",
    [name, address] // location instead of email
    );


    res.json(newStore.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});



// Request Password Reset

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) return res.status(404).json({ msg: "User not found" });

    // generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await pool.query("UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE email=$3", [
      resetToken,
      expiry,
      email,
    ]);


    res.json({ msg: "Password reset token generated", resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Reset Password

app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE reset_token=$1 AND reset_token_expiry > NOW()",
      [token]
    );
    if (user.rows.length === 0) return res.status(400).json({ msg: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password=$1, reset_token=NULL, reset_token_expiry=NULL WHERE id=$2",
      [hashedPassword, user.rows[0].id]
    );

    res.json({ msg: "Password reset successful! Please login." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


app.get("/admin/dashboard", verifyToken(["admin"]), async (req, res) => {
  try {
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
    const totalStores = await pool.query("SELECT COUNT(*) FROM stores");
    const totalRatings = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      totalUsers: totalUsers.rows[0].count,
      totalStores: totalStores.rows[0].count,
      totalRatings: totalRatings.rows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



// Admin: Get all users

app.get("/admin/users", verifyToken(["admin"]), async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, name, email, address, role FROM users ORDER BY id"
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// Owner Dashboard: Get stores and their ratings
app.get("/owner/dashboard", verifyToken(["owner"]), async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // Get all stores of this owner
    const storesRes = await pool.query(
      "SELECT id, name,address, average_rating, total_ratings FROM stores WHERE owner_id = $1",
      [ownerId]
    );

    // For each store, get all users who rated
    const storesWithRatings = await Promise.all(
      storesRes.rows.map(async (store) => {
        const ratingsRes = await pool.query(
          "SELECT u.id AS user_id, u.name AS user_name, u.email, r.rating, r.comment FROM ratings r JOIN users u ON r.user_id = u.id WHERE r.store_id = $1",
          [store.id]
        );

        return {
          ...store,
          ratings: ratingsRes.rows
        };
      })
    );

    res.json(storesWithRatings);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
app.put("/owner/update-password", verifyToken(["owner"]), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [ownerId]);
    if (!userRes.rows[0]) return res.status(404).json({ msg: "User not found" });

    const validPass = await bcrypt.compare(oldPassword, userRes.rows[0].password);
    if (!validPass) return res.status(400).json({ msg: "Old password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, ownerId]);

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// GET /stores/:id/ratings
app.get("/stores/:id/ratings", async (req, res) => {
  const storeId = req.params.id;
  try {
    const ratings = await pool.query(
      `SELECT r.id, r.rating, r.comment, u.name AS user_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1`,
      [storeId]
    );
    res.json(ratings.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// user update password
app.put("/user/update-password", verifyToken(["normal"]), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const userRes = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    if (!userRes.rows.length) return res.status(404).json({ msg: "User not found" });

    const validPass = await bcrypt.compare(oldPassword, userRes.rows[0].password);
    if (!validPass) return res.status(400).json({ msg: "Old password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashedPassword, req.user.id]);

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


//This are functionlaities for admin only ...

//  Admin changes user password
app.put("/admin/change-user-password", verifyToken(["admin"]), async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query("UPDATE users SET password=$1 WHERE id=$2 RETURNING name, email", [hashedPassword, userId]);
    
    if (result.rowCount === 0) return res.status(404).json({ msg: "User not found" });
    
    res.json({ msg: `Password changed for ${result.rows[0].name}` });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

//  Admin assigns store to owner
app.put("/admin/assign-store", verifyToken(["admin"]), async (req, res) => {
  try {
    const { storeId, ownerId } = req.body;
    
    const result = await pool.query("UPDATE stores SET owner_id=$1 WHERE id=$2 RETURNING name", [ownerId, storeId]);
    
    if (result.rowCount === 0) return res.status(404).json({ msg: "Store not found" });
    
    res.json({ msg: `Store "${result.rows[0].name}" assigned successfully` });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

//  Get owners for dropdown
app.get("/admin/owners", verifyToken(["admin"]), async (req, res) => {
  try {
    const owners = await pool.query("SELECT id, name, email FROM users WHERE role='owner' ORDER BY name");
    res.json(owners.rows);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

//  Update existing stores endpoint to include owner info
app.get("/admin/stores-with-owners", verifyToken(["admin"]), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.address, s.location, s.average_rating, s.total_ratings, s.owner_id,
             u.name as owner_name, u.email as owner_email
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});



app.get("/owner/dashboard", verifyToken(["owner"]), async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // Get all stores of this owner
    const storesRes = await pool.query(
      "SELECT id, name, address, location, average_rating, total_ratings FROM stores WHERE owner_id = $1",
      [ownerId]
    );

    // For each store, get all users who rated with complete user information
    const storesWithRatings = await Promise.all(
      storesRes.rows.map(async (store) => {
        const ratingsRes = await pool.query(
          `SELECT 
            u.id AS user_id, 
            u.name AS user_name, 
            u.email, 
            r.rating, 
            r.comment,
            r.created_at,
            r.updated_at
          FROM ratings r 
          JOIN users u ON r.user_id = u.id 
          WHERE r.store_id = $1 
          ORDER BY r.created_at DESC`,
          [store.id]
        );

        return {
          ...store,
          ratings: ratingsRes.rows
        };
      })
    );

    res.json(storesWithRatings);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


app.put("/owner/update-password", verifyToken(["owner"]), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [ownerId]);
    if (!userRes.rows[0]) return res.status(404).json({ msg: "User not found" });

    const validPass = await bcrypt.compare(oldPassword, userRes.rows[0].password);
    if (!validPass) return res.status(400).json({ msg: "Old password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, ownerId]);

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
