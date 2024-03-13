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
    const { page = 1, limit = 10 } = req.query;
    const cacheKey = `tasks_page_${page}_limit_${limit}`;

    if (redisClient.isReady) {
        try {
            const data = await redisClient.get(cacheKey);
            if (data) {
                console.log('Cached tasks found');
                const tasks = JSON.parse(data);
                const paginatedTasks = paginateTasks(tasks, page, limit);
                res.json(paginatedTasks);
            } else {
                // Continue to the next middleware if data is not found in cache
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
        const { page = 1, limit = 10 } = req.query;
        const tasks = await Task.find();

        // Set tasks in cache for future requests
        if (redisClient.isReady) {
            const cacheKey = `tasks_page_${page}_limit_${limit}`;
            await redisClient.set(cacheKey, JSON.stringify(tasks), 'EX', 3600); // Cache tasks for 1 hour
        }

        const paginatedTasks = paginateTasks(tasks, page, limit);
        const endTime = Date.now();
        const latency = endTime - startTime;
        console.log(`Database hit: Latency ${latency}ms`);
        res.json(paginatedTasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


function paginateTasks(tasks, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    return tasks.slice(startIndex, endIndex);
}

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
