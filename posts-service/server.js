const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { gql } = require("graphql-tag");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { EventEmitter } = require("events");
const bodyParser = require("body-parser");
const { connectQueue, QUEUE_NAME } = require('./config/rabbitmq');
const amqp = require('amqplib');

const prisma = new PrismaClient();
const eventEmitter = new EventEmitter();
const POST_ADDED = "POST_ADDED";

// Define type definitions
const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
  }

  type Query {
    posts: [Post]
    post(id: ID!): Post
  }

  type Mutation {
    createPost(title: String!, content: String!): Post
    updatePost(id: ID!, title: String, content: String): Post
    deletePost(id: ID!): Post
  }

  type Subscription {
    postAdded: Post
  }
`;

// Helper: async iterator from EventEmitter
function createAsyncIterator(eventName) {
  const iterator = {
    next: () =>
      new Promise((resolve) => {
        const handler = (payload) => {
          resolve({ value: { postAdded: payload }, done: false });
        };
        eventEmitter.once(eventName, handler);
      }),
    return: () => {
      return Promise.resolve({ value: undefined, done: true });
    },
    throw: (error) => {
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
  return iterator;
}

let channel;

// Initialize RabbitMQ connection
async function initializeRabbitMQ() {
    const { channel: ch } = await connectQueue();
    channel = ch;
}

initializeRabbitMQ().catch(console.error);

// In your resolvers, add RabbitMQ messaging
// Fix the variable name from rabbitChannel to channel in createPost
const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
    post: (_, { id }) => prisma.post.findUnique({ where: { id: Number(id) } })
  },
  Mutation: {
    createPost: async (_, { title, content }) => {
      const post = await prisma.post.create({
        data: { title, content },
      });
      
      // Log and send to RabbitMQ
      console.log(`New post subscription: ${JSON.stringify(post)}`);
      if (channel) {
        channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(JSON.stringify({ type: 'POST_CREATED', post }))
        );
      }

      // Emit for GraphQL subscription
      eventEmitter.emit(POST_ADDED, post);
      
      return post;
    },
    
    updatePost: async (_, { id, title, content }) => {
      const post = await prisma.post.update({
        where: { id: Number(id) },
        data: { title, content }
      });
      
      if (channel) {
        channel.sendToQueue(
            QUEUE_NAME,  // Use consistent QUEUE_NAME instead of hardcoded string
            Buffer.from(JSON.stringify({ type: 'POST_UPDATED', post }))
        );
      }
      
      return post;
    },
    
    deletePost: async (_, { id }) => {
      const post = await prisma.post.delete({
        where: { id: Number(id) }
      });
      
      if (channel) {
        channel.sendToQueue(
            QUEUE_NAME,  // Use consistent QUEUE_NAME instead of hardcoded string
            Buffer.from(JSON.stringify({ type: 'POST_DELETED', id }))
        );
      }
      
      return post;
    }
  },
  // Fix the Subscription resolver syntax
  Subscription: {
    postAdded: {
      subscribe: () => createAsyncIterator(POST_ADDED),
    },
  }
};

// Remove extra closing brace


// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Setup Express and HTTP server
const app = express();
app.use(cors());
app.use(bodyParser.json());
const httpServer = http.createServer(app);

// Setup WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
useServer({ schema }, wsServer);

// Start Apollo Server
const apolloServer = new ApolloServer({
  schema,
});

async function startServer() {
  await apolloServer.start();
  app.use("/graphql", expressMiddleware(apolloServer));

  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 WebSocket server ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer();

// Add RabbitMQ connection setup
async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'posts_queue';
  await channel.assertQueue(queue);
  return { connection, channel, queue };
}
