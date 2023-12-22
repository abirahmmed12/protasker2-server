const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x8pzcmr.mongodb.net/TaskManage?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process on connection failure
    }
}

async function closeDatabaseConnection() {
    try {
        await client.close();
        console.log("Closed MongoDB connection");
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
    }
}

async function run() {
    try {
        const userCollection = client.db("TaskManage").collection("users");
        const tasksCollection = client.db("TaskManage").collection("tasks");

        // get users 
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });
        // get tasks 
        app.get('/tasks', async (req, res) => {
            const result = await tasksCollection.find().toArray();
            res.send(result);
        });
        app.get('/tasks/:id', async (req, res) => {
            const taskId = req.params.id
            const result = await tasksCollection.findOne({ _id: new ObjectId(taskId) },);
            res.send(result);
        });
        // post users 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });
        // post tasks 
        app.post('/tasks', async (req, res) => {
            const tasks = req.body;
            const result = await tasksCollection.insertOne(tasks);
            res.send(result);
        });

        // update tasks 
        app.put('/tasks/:id', async (req, res) => {

            const taskId = req.params.id;
            const newTaskStatus = req.body.newStatus;
            console.log(taskId, newTaskStatus);

            const result = await tasksCollection.updateOne(
                { _id: new ObjectId(taskId) },
                { $set: { taskStatus: newTaskStatus } }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ message: 'TaskStatus updated successfully' });
            } else {
                res.status(404).json({ message: 'Task not found' });
            }
        });
        // update 
        app.put('/user/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateTask = req.body;
            console.log(updateTask);
            const Task = {
                $set: {
                    userName: updateTask.userName,
                    userEmail: updateTask.userEmail,
                    task: updateTask.task,
                    taskStatus: updateTask.taskStatus,
                    deadline: updateTask.deadline,

                }
            }
            const result = await tasksCollection.updateOne(filter, Task, options);
            res.send(result);
        })
        // delete 
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tasksCollection.deleteOne(query);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Task Management  Server is running");
});


app.listen(port, () => {
    console.log(`Task Management  Server is running :${port}`);
});