import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { GetProgramAccountsConfig, WalletAdapter } from '../types/web3';
import { GetProgramAccountsFilter } from '../types/web3';
import {
  ClaimFarmedParams,
} from '.';
import { SOLANA_RPC_ENDPOINT } from '..';
import { EMPTY_PUBLIC_KEY, FARMING_PROGRAM_ADDRESS } from '../constants';
import { StopFarmingParams, FarmerWithPubKey, FarmWithPubKey, GetFarmersParams, GetFarmingStateParams, StartFarmingParams, ClaimElegibleHarvestRestAccount } from './types';
import { FARMER_LAYOUT, FARM_LAYOUT } from './layout';
import { accountDiscriminator } from '../utils';
import base58 from 'bs58';
import { Farming } from './farming';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createTokenAccountTransaction, sendTransaction, wrapWallet } from '../transactions';

/**
 * Aldrin AMM Pools farming(staking) client
 */
export class FarmingClient {


  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {
  }


  /**
   * Get farming state for pool
   * @param params
   * @returns
   */

  async getFarms(
    params: GetFarmingStateParams
  ): Promise<FarmWithPubKey[]> {
    const programId = FARMING_PROGRAM_ADDRESS

    const farmPubKeys = (params.farms || []).map((_) => _.toString())

    const filters: GetProgramAccountsFilter[] = [
      {
        memcmp: {
          offset: 0,
          bytes: base58.encode(await accountDiscriminator('Farm')),
        },
      },
      { dataSize: FARM_LAYOUT.span },
    ]
    if (params.stakeMint) {
      const stakeMintOffset = FARM_LAYOUT.offsetOf('stakeMint')

      if (!stakeMintOffset) {
        throw new Error('No offset for stakeMint')
      }
      filters.push({ memcmp: { offset: stakeMintOffset, bytes: params.stakeMint.toBase58() } })
    }

    const config: GetProgramAccountsConfig = {
      commitment: 'finalized',
      encoding: 'base64',
      filters,
    };

    const farms = await this.connection.getProgramAccounts(programId, config)

    const farmsForPubKeys = farmPubKeys.length ?
      farms.filter((account: { pubkey: PublicKey }) => farmPubKeys.includes(account.pubkey.toBase58())) :
      farms

    return farmsForPubKeys.map((account: { pubkey: PublicKey; account: { data: Buffer } }) => {
      const farm = FARM_LAYOUT.decode(account.account.data)
      return {
        ...farm,
        publicKey: account.pubkey,
      }
    }).map((farm: any) => ({ ...farm, harvests: farm.harvests.filter((harvest: { mint: { equals: (arg0: PublicKey) => boolean } }) => !harvest.mint.equals(EMPTY_PUBLIC_KEY)) }))
  }


  /**
   * Get farming tickets for pool/user
   * @param params
   * @returns
   */

  async getFarmers(params: GetFarmersParams = {}): Promise<FarmerWithPubKey[]> {
    const programId = FARMING_PROGRAM_ADDRESS

    const filters: GetProgramAccountsFilter[] = [
      {
        memcmp: {
          offset: 0,
          bytes: base58.encode(await accountDiscriminator('Farmer')),
        },
      },
      { dataSize: FARMER_LAYOUT.span },
    ]

    if (params.farm) {
      const farmOffset = FARMER_LAYOUT.offsetOf('farm')
      if (!farmOffset) {
        throw new Error('No offset for farm')
      }
      filters.push({ memcmp: { offset: farmOffset, bytes: params.farm.toBase58() } })
    }

    if (params.authority) {
      const authorityOffset = FARMER_LAYOUT.offsetOf('authority')
      if (!authorityOffset) {
        throw new Error('No offset for farm')
      }
      filters.push({ memcmp: { offset: authorityOffset, bytes: params.authority.toBase58() } })
    }

    const config: GetProgramAccountsConfig = {
      commitment: 'finalized',
      encoding: 'base64',
      filters,
    };

    const farmers = await this.connection.getProgramAccounts(programId, config)

    return farmers
      .map((account: { pubkey: PublicKey; account: { data: Buffer } }) => {
        const farmer = FARMER_LAYOUT.decode(account.account.data)
        return {
          ...farmer,
          publicKey: account.pubkey,
        }
      })
      .map((farmer: FarmerWithPubKey) => ({
        ...farmer,
        harvests: farmer.harvests.filter((harvest) => !harvest.mint.equals(EMPTY_PUBLIC_KEY)),
      }))
  }

  /**
   * Start farming, creates Farming Ticket
   * @param params
   * @returns Transaction Id
   */

  async startFarming(params: StartFarmingParams): Promise<string> {
    const farms = await this.getFarms({ farms: [params.farm] })

    if (farms.length !== 1) {
      throw new Error('Cant find farm!')
    }

    const farm = farms[0]

    const farmerForFarm = await this.getFarmers({
      farm: params.farm,
      authority: params.wallet.publicKey,
    })

    const tokensForWallet = await this.connection.getParsedTokenAccountsByOwner(params.wallet.publicKey, { programId: TOKEN_PROGRAM_ID })

    const stakeMint = farm.stakeMint.toString()
    const stakeWallet = tokensForWallet.value.find((_) => _.account.data.parsed.info.mint === stakeMint)
    if (!stakeWallet) {
      throw new Error('No token account for stakeable mint!')
    }
    const transaction = new Transaction()
    if (farmerForFarm.length === 0) {
      transaction.add(await Farming.createFarmerInstruction(params.farm, params.wallet.publicKey))
    }
    transaction.add(
      await Farming.startFarmingInstruction({
        farm: params.farm,
        walletAuthority: params.wallet.publicKey,
        stakeWallet: stakeWallet.pubkey,
        stakeVault: farm.stakeVault,
        tokenAmount: params.tokenAmount,
      })
    )


    return sendTransaction({
      wallet: wrapWallet(params.wallet),
      connection: this.connection,
      transaction,
    })
  }


  /**
   * End farming
   */

  async stopFarming(params: StopFarmingParams) {
    const farms = await this.getFarms({ farms: [params.farm] })

    if (farms.length !== 1) {
      throw new Error('Can\'t find farm!')
    }

    const farm = farms[0]

    const farmersForFarm = await this.getFarmers({
      farm: params.farm,
      authority: params.wallet.publicKey,
    })

    if (farmersForFarm.length !== 1) {
      throw new Error('Can\'t find farmer!')
    }

    const tokensForWallet = await this.connection.getParsedTokenAccountsByOwner(params.wallet.publicKey, { programId: TOKEN_PROGRAM_ID })
    const stakeMint = farm.stakeMint.toString()
    let stakeWallet = tokensForWallet.value.find((_) => _.account.data.parsed.info.mint === stakeMint)?.pubkey

    const transaction = new Transaction()

    if (!stakeWallet) {
      const { newAccountPubkey, transaction: tx } = await createTokenAccountTransaction({ wallet: params.wallet, mint: farm.stakeMint })
      stakeWallet = newAccountPubkey
      transaction.add(tx)
    }

    transaction.add(
      await Farming.stopFarmingInstruction({
        farm: params.farm,
        authority: params.wallet.publicKey,
        unstakeMax: params.unstakeMax,
        stakeWallet,
      })
    )

    return sendTransaction({
      wallet: wrapWallet(params.wallet),
      connection: this.connection,
      transaction,
    })

  }

  /**
   * Claim staking rewards
   * @param params
   * @returns Transaction Id
   */
  async claimFarmed(params: ClaimFarmedParams): Promise<string> {
    const farms = await this.getFarms({ farms: [params.farm] })

    if (farms.length !== 1) {
      throw new Error('Can\'t find farm!')
    }

    const farm = farms[0]

    const farmersForFarm = await this.getFarmers({
      farm: params.farm,
      authority: params.wallet.publicKey,
    })

    if (farmersForFarm.length !== 1) {
      throw new Error('Can\'t find farmer!')
    }

    const transaction = new Transaction()
    const tokensForWallet = await this.connection.getParsedTokenAccountsByOwner(params.wallet.publicKey, { programId: TOKEN_PROGRAM_ID })
    const claimRestAccounts: ClaimElegibleHarvestRestAccount[] = []
    for (const harvest of farm.harvests) {
      let userRewardAccount = tokensForWallet.value.find(
        (ut) => ut.account.data.parsed.info.mint === harvest.mint.toString()
      )?.pubkey

      if (!userRewardAccount) {
        const { newAccountPubkey, transaction: newAccountTx } =
          await createTokenAccountTransaction({ wallet: params.wallet, mint: harvest.mint })
        userRewardAccount = newAccountPubkey

        transaction.add(newAccountTx)
      }
      claimRestAccounts.push({
        userRewardAccount,
        harvestVaultAccount: harvest.vault,
      })
    }

    transaction.add(
      await Farming.claimEligibleHarvest({
        farm: params.farm,
        authority: params.wallet.publicKey,
        restAccounts: claimRestAccounts,
      })
    )

    return sendTransaction({
      wallet: wrapWallet(params.wallet),
      connection: this.connection,
      transaction,
    })
  }
}
