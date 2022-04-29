import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi"


const app = express();
app.use(cors());
app.use(json());
dotenv.config();
// DAYJS
let hour = dayjs().format("HH:mm:ss");
//ENV
const DATABASE = process.env.DATABASE;
//Joi
const participantsSchema = joi.object({
  name: joi.string().min(1).required(),
});
let database;
const mongoClient = new MongoClient(process.env.MONGO_URL);

app.post("/participants", async (req, res) => {
  try {
    await mongoClient.connect();
    database = mongoClient.db(DATABASE);
    const result = await participantsSchema.validateAsync(req.body)
    console.log(result);
    const doesExist = await database.collection("users").findOne({name:result.name})
    console.log(doesExist);
    if(doesExist){
      res.sendStatus(409)
      return
    }
    await database.collection("users").insertOne({
      name:result.name,
      lastStatus: Date.now(),
    });
    await database.collection("messages").insertOne({
      from: result.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: hour,
    });
    res.sendStatus(201);
    mongoClient.close();
  } catch(error) {
    console.log(error);
    if(error.isJoi === true){
      res.sendStatus(422)
      return;
    }
    res.sendStatus(500)
  }
});

app.get("/participants", (req, res) => {
  const promise = mongoClient.connect();
  promise.then(() => {
    database = mongoClient.db(DATABASE);
    database
      .collection("users")
      .find()
      .toArray()
      .then((users) => {
        res.send(users);
      });
    mongoClient.close();
  });
  promise.catch(() => {
    res.send(404);
  });
});

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit);
  const user = req.headers.user;
  try {
    await mongoClient.connect();
    database = mongoClient.db(process.env.DATABASE);
    const messages = await database
      .collection("messages")
      .find({ $or: [{ from: user }, { to: user }, { to: "Todos" }] })
      .toArray();
    if (limit !== undefined) {
      res.send(messages.slice(-limit));
      mongoClient.close();
      return;
    }
    res.send(messages);
  } catch {}
});

app.post("/messages", async (req, res) => {
  let message = req.body;
  let user = req.headers.user;
  message.from = user;
  message.time = hour;
  try {
    await mongoClient.connect();
    database = mongoClient.db(DATABASE);
    await database.collection("messages").insertOne({ message });
    res.sendStatus(201);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  let user = req.headers.user;
  try {
    await mongoClient.connect();
    database = mongoClient.db(DATABASE);
    let userCollection = database.collection("users");
    let userDB = await userCollection.findOne({ name: user });
    if (userDB === null) {
      res.sendStatus(404);
      mongoClient.close();
      return;
    }
    await userCollection.updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );
    res.sendStatus(200);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

async function checkUsers() {
  try {
    await mongoClient.connect();
    database = mongoClient.db(DATABASE);
    let userCollection = await database.collection("users").find().toArray();
    userCollection.forEach((user) => {
      if (Date.now() - user.lastStatus > 10000) {
        database.collection("users").deleteOne({ name: user.name });
        database.collection("messages").insertOne({
          from: user.name,
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          time: hour,
        });
      }
    });
  } catch {}
}

setInterval(checkUsers, 2000);

const port = process.env.PORT;
app.listen(port, () =>
  console.log(chalk.bold.green(`Servidor em pé na porta ${port}`))
);
