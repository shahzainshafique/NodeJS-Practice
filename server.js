const express = require("express");
const cors = require("cors");
const { connectDb } = require("./config/connectDb");
const { connectRedis } = require("./config/connectRedis");
require("dotenv").config();

const Task = require('./models/Task.model');

const app = express();
app.use(express.json()); // Middleware to parse JSON body
app.use(cors());

//api routes
app.use('/api/user', require("./routes/userRoutes"));

//mongoDB connection
connectDb();
const redisClient = connectRedis();
console.log(redisClient); // Make sure redisClient is properly initialized

const cacheTask = (req, res, next) => {
    const startTime = Date.now();
    console.log('tasks'+ redisClient.isReady);
    redisClient.isReady && redisClient.get('tasks', (err, data) => {
        if (err) throw err;

        if (data) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            console.log(`Cache hit: Latency ${latency}ms`);
            res.send(JSON.parse(data));
        } else {
            next();
        }
    });
};

const clearTaskCache = (req, res, next) => {
    redisClient.del('tasks', (err, response) => {
        if (err) throw err;
        console.log('Cache cleared: ' + response);
        next();
    });
};

app.get('/tasks', cacheTask,async (req, res) => {
    try {
        const startTime = Date.now();
        const tasks = await Task.find();
        console.log('tasks'+ redisClient.connected);
        redisClient.connected && redisClient.set('tasks', 3600, JSON.stringify(tasks)); // Cache tasks for 1 hour
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/tasks', async (req, res) => {
    console.log(req.body); // Make sure req.body is properly parsed
    const task = new Task({
        title: req.body.title,
        description: req.body.description
    });

    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.listen(process.env.PORT, () => console.log(`App listening on ${process.env.PORT}!`));
