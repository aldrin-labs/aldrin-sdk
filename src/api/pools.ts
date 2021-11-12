import { API_URL } from '.';
import { GraphQLClient, gql } from 'graphql-request'
import { AldrinApiClient } from './base';

/**
 * Aldrin's backed API client
 */

export class AldrinApiPoolsClient extends AldrinApiClient {


  /**
   * Get TVL for AMM pools
   * @returns last value in USD 
   */
  async getTotalVolumeLocked(): Promise<number> {

    const timestampFrom = Math.floor(Date.now() / 1000 - 60 * 60)
    const timestampTo = Math.floor(Date.now() / 1000)


    const query = gql`
    {
      getTotalVolumeLockedHistory(
        timezone: "UTC", 
        timestampFrom: ${timestampFrom}, 
        timestampTo: ${timestampTo}
      ) {
        volumes {
          vol
          date
        }
      }
    }
    `

    const response = await this.gqlClient.request(query)
    return response.getTotalVolumeLockedHistory.volumes[0].vol
  }
}
