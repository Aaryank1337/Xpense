const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/db");
const connectDB = db.connectDB;

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xpense Backend Running"));

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
// New simplified features
const communityRoutes = require("./routes/communityRoutes");
const dailySavingRoutes = require("./routes/dailySavingRoutes");
const bookRoutes = require("./routes/bookRoutes");
const quizRoutes = require("./routes/quizRoutes");


app.use("/api/tokens", tokenRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/expenses", expenseRoutes);
app.use("/api/chatbot", chatbotRoutes);
// New simplified feature routes
app.use("/api/community", communityRoutes);
app.use("/api/daily-saving", dailySavingRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/quiz", quizRoutes);





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));