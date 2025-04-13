import { WebSocket } from 'ws';

class RabbitMQService {
    constructor() {
        this.ws = null;
        this.subscribers = new Map();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:4000/rabbitmq'); // You'll need to implement this endpoint in your backend

        this.ws.onmessage = (event) => {
            const { queue, data } = JSON.parse(event.data);
            if (this.subscribers.has(queue)) {
                this.subscribers.get(queue).forEach(callback => callback(data));
            }
        };

        this.ws.onclose = () => {
            setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
        };
    }

    subscribe(queue, callback) {
        if (!this.subscribers.has(queue)) {
            this.subscribers.set(queue, new Set());
        }
        this.subscribers.get(queue).add(callback);
    }

    unsubscribe(queue, callback) {
        if (this.subscribers.has(queue)) {
            this.subscribers.get(queue).delete(callback);
        }
    }
}

export const rabbitmqService = new RabbitMQService();