import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import mockLink from './graphql/mockLink';

const httpLink = createHttpLink({
    uri: '/graphql',
});

// For now, we use mockLink to intercept requests and provide local mock data.
// To switch back to the live backend, simply remove mockLink from the array below.
const client = new ApolloClient({
    link: from([mockLink, httpLink]),
    cache: new InMemoryCache()
});

export default client;
