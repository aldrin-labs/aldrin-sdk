import {sha256} from 'js-sha256'


// serum-anchor
// Not technically sighash, since we don't include the arguments, as Rust
// doesn't allow function overloading.

export function sighash(name: string): Buffer {
  const preimage = `global:${name}`;
  return Buffer.from(sha256.digest(preimage)).slice(0, 8);
}
