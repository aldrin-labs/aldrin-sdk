import { Connection, PublicKey, GetProgramAccountsConfig } from '@solana/web3.js';

export type { GetProgramAccountsConfig };

export const toProgramAccountConfig = (config: GetProgramAccountsConfig): GetProgramAccountsConfig => ({
  commitment: config.commitment || 'confirmed',
  encoding: 'base64',
  filters: config.filters || []
});

export const getProgramAccounts = async (
  connection: Connection,
  programId: PublicKey,
  config: GetProgramAccountsConfig
) => {
  const formattedConfig = toProgramAccountConfig(config);
  return connection.getProgramAccounts(programId, formattedConfig);
};
