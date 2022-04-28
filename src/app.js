import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

let hour = dayjs().format("HH:mm:ss");
let date = dayjs().format("DD/MM/YYYY HH:mm:ss");

let database;
const mongoClient = new MongoClient(process.env.MONGO_URL);

app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;

    await mongoClient.connect().then(() => {
      database = mongoClient.db("bate-papo-uol");
    });
    await database.collection("users").insertOne({
      name,
      lastStatus: Date.now(),
    });
    await database.collection("messages").insertOne({
      from: "xxx",
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: hour,
    });
    res.sendStatus(201);
  } catch {}
});


const port = process.env.PORT;
app.listen(port, () =>
  console.log(chalk.bold.green(`Servidor em pé na porta ${port}`))
);
