import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

// HTTP Link for Queries and Mutations
const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

// WebSocket Link for Subscriptions using graphql-ws
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
  })
);

// Use split to send data to each link depending on the kind of operation
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

// Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
