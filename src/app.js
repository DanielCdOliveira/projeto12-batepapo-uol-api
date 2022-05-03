import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";
import { stripHtml } from "string-strip-html";
// INICIALIZATION
const app = express();
app.use(cors());
app.use(json());
dotenv.config();
// DAYJS
let hour = dayjs().format("HH:mm:ss");
//ENV
const DATABASE = process.env.DATABASE;
//JOI
const participantsSchema = joi.object({
  name: joi.string().min(1).required(),
});
const messagesSchema = joi.object({
  to: joi.string().min(1).required(),
  text: joi.string().min(1).required(),
  type: joi.any().valid("message", "private_message").required(),
});
// MONGODB CONNECTION
const mongoClient = new MongoClient(process.env.MONGO_URL);
await mongoClient.connect();
let database = mongoClient.db(DATABASE);
// PARTICIPANTS
app.post("/participants", async (req, res) => {
  const user = req.body;
  user.name = stripHtml(user.name.trim()).result;
  try {
    const result = await participantsSchema.validateAsync(req.body);

    const doesExist = await database
      .collection("users")
      .findOne({ name: result.name });

    if (doesExist) {
      res.sendStatus(409);
      return;
    }
    await database.collection("users").insertOne({
      name: result.name,
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
  } catch (error) {
    if (error.isJoi === true) {
      res.sendStatus(422);
      return;
    }
    res.sendStatus(500);
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
  });
  promise.catch(() => {
    res.send(404);
  });
});

// MESSAGES
app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  try {
    const messages = await database
      .collection("messages")
      .find({ $or: [{ from: user }, { to: user }, { to: "Todos" }] })
      .toArray();
    if (limit) {
      res.send(messages.slice(-limit));
      return;
    }
    res.send(messages);
  } catch {
    res.sendStatus(500);
  }
});
app.post("/messages", async (req, res) => {
  let message = req.body;
  message.text = stripHtml(message.text.trim()).result;
  let { user } = req.headers;
  let doesExist = null;
  try {
    await messagesSchema.validateAsync(message);
    doesExist = await database
      .collection("users")
      .findOne({ name: message.to });
    if (doesExist || message.to === "Todos") {
      message.from = user;
      message.time = hour;
    } else {
      res.sendStatus(422);
      return;
    }
    await database.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (error) {
    if (error.isJoi === true) {
      res.sendStatus(422);
      return;
    }
    res.sendStatus(500);
  }
});

// STATUS
app.post("/status", async (req, res) => {
  let user = req.headers.user;
  try {
    let userCollection = database.collection("users");
    let userDB = await userCollection.findOne({ name: user });
    if (userDB === null) {
      res.sendStatus(404);
      return;
    }
    await userCollection.updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

// CHECK USERS
async function checkUsers() {
  try {
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
  } catch {
    res.sendStatus(500);
  }
}
setInterval(checkUsers, 15000);

// DELETE MESSAGE
app.delete("/messages/:id", async (req, res) => {
  const user = req.headers.user;
  const id = req.params.id;
  try {
    let message = await database
      .collection("messages")
      .findOne({ _id: new ObjectId(id) });
    if (!message) {
      res.sendStatus(404);
      return;
    }
    if (user !== message.from) {
      res.sendStatus(401);
      return;
    }
    database.collection("messages").deleteOne({ _id: new ObjectId(id) });
  } catch {}
});

// SERVER INICIALIZATION
const port = process.env.PORT;
app.listen(port, () =>
  console.log(chalk.bold.green(`Servidor em pé na porta ${port}`))
);
