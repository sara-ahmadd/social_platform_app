import express from "express";
import { DBConnection } from "./src/DB/db.connection.js";
import authController from "./src/modules/auth/auth.controller.js";

const app = express();

const port = process.env.PORT;

await DBConnection();

app.use(express.json());
app.get("/", (req, res, next) => res.json({ message: "success" }));
app.use("/auth", authController);

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
