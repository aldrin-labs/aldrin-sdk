import {
  Connection,
  PublicKey,
  GetProgramAccountsConfig,
  GetProgramAccountsResponse,
  Commitment
} from '@solana/web3.js';
import { GetProgramAccountsFilter } from '../types/web3';

const convertFilter = (filter: GetProgramAccountsFilter): GetProgramAccountsFilter => {
  if ('dataSize' in filter) {
    return { dataSize: filter.dataSize };
  }
  if ('memcmp' in filter) {
    return { memcmp: filter.memcmp };
  }
  throw new Error('Invalid filter type');
};

export const getProgramAccounts = async (
  connection: Connection,
  programId: PublicKey,
  config: { filters?: GetProgramAccountsFilter[], commitment?: Commitment }
): Promise<GetProgramAccountsResponse> => {
  try {
    const formattedConfig: GetProgramAccountsConfig = {
      commitment: config.commitment || 'confirmed',
      encoding: 'base64',
      filters: config.filters?.map(convertFilter)
    };

    return connection.getProgramAccounts(programId, formattedConfig);
  } catch (error) {
    console.error('Error getting program accounts:', error);
    throw error;
  }
};