const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xpense Backend Running"));

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const rewardRoutes = require("./routes/rewardRoutes");


app.use("/api/rewards", rewardRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));