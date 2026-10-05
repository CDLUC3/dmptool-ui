"use client"

import { ApolloLink, HttpLink } from "@apollo/client";
import { authLink, errorLink, retryLink } from "@/lib/graphql/graphqlHelper";
import { errorTypePolicies } from '@/lib/graphql/errorTypePolicies';
import { guidanceTypePolicies } from '@/lib/graphql/guidanceTypePolicies';
import { displayLogicTypePolicies } from '@/lib/graphql/displayLogicTypePolicies';

//From https://github.com/apollographql/apollo-client-nextjs
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

import { setApolloClient } from './apolloClient';

function makeClient() {
  const httpLink = new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_SERVER_ENDPOINT}/graphql`
  });

  const client = new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        ...errorTypePolicies, // This is to prevent Apollo cache merge issues with error fields
        ...guidanceTypePolicies, // Custom type policies for guidance types
        ...displayLogicTypePolicies // Custom type policies for display logic queries
      }
    }),
    link: ApolloLink.from([
      errorLink,
      authLink,
      retryLink,
      httpLink,
    ]),
  });

  setApolloClient(client);
  return client;
}

//To create a component to wrap the app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient} >
      {children}
    </ApolloNextAppProvider>
  );
}
