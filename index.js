import express from "express";
import { DBConnection } from "./src/DB/db.connection.js";
import authController from "./src/modules/auth/auth.controller.js";
import userController from "./src/modules/user/user.controller.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app = express();

const port = process.env.PORT;

await DBConnection();
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authController);
app.use("/user", userController);

// app.get("/", (req, res, next) => res.json({ message: "success" }));
app.all("*", (req, res, next) => {
  return next(new Error("API not found!"));
});

//global error handler
app.use((error, req, res, next) => {
  const status = error.cause || 500;
  return res
    .status(status)
    .json({ status: "Error", error: error.message, stack: error.stack });
});

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
