const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB(); // connect to MongoDB

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: "process.env.CLIENT_URL",
  credentials: true
}));
// Middleware
app.use(cors({ origin: process.env.CLIENT_URL,   credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const complaintRoutes  = require("./routes/complaints");
const analyticsRoutes  = require("./routes/analytics");

app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/analytics",  analyticsRoutes);

// Make io accessible in all routes
app.set("io", io);

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("join_admin", () => {
    socket.join("admin_room");
    console.log("Admin joined admin room");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🍽️ Canteen API is running!" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});


