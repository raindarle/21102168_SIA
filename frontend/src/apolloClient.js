import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql", // Update if your backend URL is different
});

const wsLink = new WebSocketLink({
  uri: "ws://localhost:4000/graphql", // WebSocket for subscriptions
  options: {
    reconnect: true,
  },
});

// Split between HTTP and WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
