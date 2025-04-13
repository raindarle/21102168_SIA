const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://localhost';

async function connectQueue() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        
        // Declare queues that we'll use
        await channel.assertQueue('post_created');
        await channel.assertQueue('post_updated');
        await channel.assertQueue('post_deleted');

        return { connection, channel };
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
}

module.exports = {
    connectQueue
};