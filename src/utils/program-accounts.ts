import { Connection, PublicKey, GetProgramAccountsConfig, GetProgramAccountsResponse } from '@solana/web3.js';
import { ProgramAccountFilter } from '../types/web3';

// Convert our filter type to web3.js filter type
const convertFilter = (filter: ProgramAccountFilter): GetProgramAccountsConfig['filters'][0] => {
  if (filter.dataSize !== undefined) {
    return { dataSize: filter.dataSize };
  }
  if (filter.memcmp) {
    return { memcmp: filter.memcmp };
  }
  throw new Error('Invalid filter type');
};

export const getProgramAccounts = async (
  connection: Connection,
  programId: PublicKey,
  config: { filters?: ProgramAccountFilter[], commitment?: string }
): Promise<GetProgramAccountsResponse> => {
  try {
    const formattedConfig: GetProgramAccountsConfig = {
      commitment: config.commitment || 'confirmed',
      encoding: 'base64',
      filters: config.filters?.map(convertFilter) || []
    };

    return connection.getProgramAccounts(programId, formattedConfig);
  } catch (error) {
    console.error('Error getting program accounts:', error);
    throw error;
  }
};
