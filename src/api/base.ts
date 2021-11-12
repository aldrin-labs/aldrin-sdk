import { GraphQLClient } from 'graphql-request'
import { API_URL } from '.'

export class AldrinApiClient {
  protected gqlClient: GraphQLClient

  /**
   * 
   * @param url API URL, should be changed to proxy for browser usage (CORS disabled)
   */
  constructor(url = API_URL) {
    this.gqlClient = new GraphQLClient(url)
  }

}
