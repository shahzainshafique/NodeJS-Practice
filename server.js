const express = require("express");
const cors = require("cors");
const { promisify } = require('util');

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

const cacheTask = async (req, res, next) => {
    const startTime = Date.now();
    if (redisClient.isReady) {
        try {
            const data = await redisClient.get('tasks');
            if (data) {
                const latency = Date.now() - startTime;
                console.log(`Cache hit: Latency ${latency}ms`);
                res.send(JSON.parse(data));
            } else {
                next();
            }
        } catch (err) {
            console.error(err);
            next();
        }
    } else {
        console.log('Redis client is not ready');
        next();
    }
};


const clearTaskCache = async (req, res, next) => {
    const data = await redisClient.del('tasks', (err, response) => {
        if (err) throw err;
        console.log('Cache cleared: ' + response);
        next();
    });
    data? next():null;
};

app.get('/tasks', cacheTask, async (req, res) => {
    try {
        const startTime = Date.now();
        const tasks = await Task.find();
        console.log('ready?',redisClient.isReady);
        if (redisClient.isReady) {
            await redisClient.set('tasks', JSON.stringify(tasks), 'EX', 3600); // Cache tasks for 1 hour
        }
        const endTime = Date.now();
        const latency = endTime - startTime;
        console.log(`Database hit: Latency ${latency}ms`);
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
