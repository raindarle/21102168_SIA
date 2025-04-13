const amqp = require('amqplib');

const QUEUE_NAME = 'posts_queue';
const SYNTHETIC_QUEUE = 'synthetic_posts_queue';

async function startPublisher() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        // Modify queue assertions with matching settings
        await channel.assertQueue(QUEUE_NAME, { durable: false });
        await channel.assertQueue(SYNTHETIC_QUEUE, { durable: false });

        console.log('Publisher waiting for messages...');

        // Consume messages from posts_queue
        channel.consume(QUEUE_NAME, (data) => {
            const message = JSON.parse(data.content);
            console.log('Received post:', message);

            if (message.type === 'POST_CREATED') {
                // Generate synthetic data
                const syntheticPost = {
                    originalId: message.post.id,
                    title: `Synthetic: ${message.post.title}`,
                    content: `Generated content based on: ${message.post.content}`,
                    timestamp: new Date().toISOString()
                };

                // Publish synthetic data
                channel.sendToQueue(
                    SYNTHETIC_QUEUE,
                    Buffer.from(JSON.stringify(syntheticPost))
                );

                console.log('Published synthetic post:', syntheticPost);
            }

            channel.ack(data);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

startPublisher();