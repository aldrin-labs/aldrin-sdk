import { gql } from 'graphql-request';
import { AldrinApiClient } from './aldrinClient';
import { GetPoolsInfoResponse, GetPriceResponse, GetStakingPoolInfoResponse, PoolInfo, StakingPoolInfoResponse } from './types';
import { poolResponseToModel } from './utils';

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

    const response = await this.gqlClient.request(query) as {
      getTotalVolumeLockedHistory: {
        volumes: Array<{ vol: number; date: string }>
      }
    }
    return response.getTotalVolumeLockedHistory.volumes[0].vol
  }


  /**
   * @returns Extended information about existing pools
   */
  async getPoolsInfo(): Promise<PoolInfo[]> {
    const query = gql`
      query getPoolsInfoQuery {
        getPoolsInfo {
          name
          parsedName
          swapToken
          poolTokenMint
          tokenA
          tokenB
          poolTokenAccountA
          poolTokenAccountB
          lpTokenFreezeVaultBalance
          tvl {
            tokenA
            tokenB
          }
          apy24h
          supply
          farming {
            farmingState
            farmingTokenVault
            farmingTokenMint
            farmingTokenMintDecimals
            farmingSnapshots
            tokensUnlocked
            tokensTotal
            tokensPerPeriod
            periodLength
            vestingPeriod
            currentTime
          }
        }
      }
    `

    const response = await this.gqlClient.request<GetPoolsInfoResponse>(query)

    const tokens = new Set<string>()

    response.getPoolsInfo.forEach((p) => {
      const [base, quote] = p.parsedName.split('_')
      tokens.add(base)
      tokens.add(quote)
    })

    const getPricesQuery = gql`
      query getDexTokensPrices($symbols: [String!]) {
        getDexTokensPrices(symbols: $symbols) {
          symbol
          price
        }
      }            
    `

    const pricesResponse = await this.gqlClient.request<GetPriceResponse>(getPricesQuery, { symbols: Array.from(tokens.values()) })

    const prices = new Map<string, number>()
    pricesResponse.getDexTokensPrices.forEach((v) => prices.set(v.symbol, v.price))

    return response.getPoolsInfo.map((p) => poolResponseToModel(p, prices))
  }

  async getStakingPoolInfo(): Promise<StakingPoolInfoResponse> {
    const query = gql`
      query {
        getStakingPoolInfo {
          swapToken
          poolSigner
          poolTokenMint
          stakingVault
          farming {
            farmingState
            farmingTokenVault
            farmingTokenMint
            farmingTokenMintDecimals
            farmingSnapshots
            tokensUnlocked
            tokensTotal
            tokensPerPeriod
            periodLength
            vestingPeriod
            currentTime
          }
        }
      }
    `

    const response = await this.gqlClient.request<GetStakingPoolInfoResponse>(query)

    return response.getStakingPoolInfo
  }
}
