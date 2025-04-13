const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'posts_queue';

async function connectQueue() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: false });
        
        console.log('Connected to RabbitMQ');
        return { connection, channel };
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
}

module.exports = {
    connectQueue,
    QUEUE_NAME
};