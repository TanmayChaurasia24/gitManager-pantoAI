import express from "express";
import githubauthrouter from "./auth/github"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/ping", (_req, res) => {
  res.send("health check!");
});
app.use("/auth/github",githubauthrouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
