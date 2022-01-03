import {sha256} from 'js-sha256'


// serum-anchor
// Not technically sighash, since we don't include the arguments, as Rust
// doesn't allow function overloading.

function shaGen(prefix: string, name: string): Buffer {
  const preimage = `${prefix}:${name}`;
  return Buffer.from(sha256.digest(preimage)).slice(0, 8);
}

export function instructionDiscriminator(name: string): Buffer {
  return shaGen('global', name)
}


// Calculates unique 8 byte discriminator prepended to all anchor accounts.
export async function accountDiscriminator(name: string): Promise<Buffer> {
  return shaGen('account', name)
}

