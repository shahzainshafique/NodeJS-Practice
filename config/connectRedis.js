// connectRedis.js
const redis = require('redis');
const { promisify } = require('util');

const connectRedis = () => {
    const client = redis.createClient();
    (async () => {
        await client.connect();
    })();
    console.log('cl'+JSON.stringify(client));

    client.on('connect', () => {
        console.log('Redis client connected');
    });

    client.on('ready', () => {
        console.log('Redis client ready');
    });

    client.on('error', (err) => {
        console.error('Redis client error:', err);
    });

    client.on('end', () => {
        console.log('Redis client connection closed');
    });

    // Promisify Redis commands
    client.getAsync = promisify(client.get).bind(client);
    client.setAsync = promisify(client.set).bind(client);

    return client;
};

module.exports = { connectRedis };
