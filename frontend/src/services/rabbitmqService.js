class RabbitMQService {
    constructor() {
        this.ws = null;
        this.listeners = new Set();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:4000/rabbitmq');
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.notifyListeners(message);
        };

        this.ws.onclose = () => {
            console.log('RabbitMQ WebSocket connection closed');
            setTimeout(() => this.connect(), 5000);
        };
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(message) {
        this.listeners.forEach(listener => listener(message));
    }
}

export const rabbitmqService = new RabbitMQService();