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
    // JOI
    await mongoClient.connect().then(() => {
      database = mongoClient.db("bate-papo-uol");
    });
    await database.collection("users").insertOne({
      name,
      lastStatus: Date.now(),
    });
    await database.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: hour,
    });
    res.sendStatus(201);
  } catch {}
});

app.get("/participants", (req, res) => {
  const promise = mongoClient.connect();
  promise.then(() => {
    database = mongoClient.db(process.env.DATABASE);
    database
      .collection("users")
      .find()
      .toArray()
      .then((users) => {
        res.send(users);
      });
  });
  promise.catch(() => {
    res.send(404);
  });
});

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    console.log(user);
  try {
    await mongoClient.connect();
    database = mongoClient.db(process.env.DATABASE);
    const messages = await database.collection("messages").find({$or: [{from:user},{to:user},{to:"Todos"}]}).toArray();
    if(limit !== undefined){
        res.send(messages.slice(-limit))
    }
    res.send(messages);
  } catch {}
});

const port = process.env.PORT;
app.listen(port, () =>
  console.log(chalk.bold.green(`Servidor em pé na porta ${port}`))
);
