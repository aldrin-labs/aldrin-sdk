import { Layout, blob, Structure, union, u8, struct, seq } from '@solana/buffer-layout';
import { u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

class PublicKeyLayout extends Layout {
  private layout: Layout

  constructor(property?: string) {
    const layout = blob(32)
    super(layout.span, property)
    this.layout = layout
  }

  getSpan(b: Uint8Array, offset?: number) {
    return this.layout.getSpan(b, offset)
  }

  decode(b: Uint8Array, offset?: number): PublicKey {
    return new PublicKey(this.layout.decode(b, offset))
  }

  encode(src: PublicKey, b: Uint8Array, offset: number): number {
    return this.layout.encode(src.toBuffer(), b, offset);
  }
}

/**
 * Layout for a public key
 */
export const publicKey = (property: string) => new PublicKeyLayout(property)
// export const publicKey = (property: string) => blob(32, property);


class U64Layout extends Layout {
  private layout: Layout
  private toNumber: boolean

  constructor(property: string, toNumber: boolean) {
    const layout = blob(8)
    super(layout.span, property)
    this.layout = layout
    this.toNumber = toNumber
  }

  getSpan(b: Uint8Array, offset?: number) {
    return this.layout.getSpan(b, offset)
  }

  decode(b: Uint8Array, offset?: number): BN | number {
    const bn = new BN(this.layout.decode(b, offset), 10, 'le');
    if (this.toNumber) {
      return bn.toNumber()
    }
    return bn
  }

  encode(src: BN, b: Uint8Array, offset: number): number {
    return this.layout.encode(src.toArrayLike(Buffer, 'le', this.layout.span), b, offset);
  }
}

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property: string, toNumber = false) => new U64Layout(property, toNumber)


export const rustEnum = (
  variants: Structure[],
  property: string,
) => {
  const unionLayout = union(u8(), u8(), property);
  variants.forEach((variant, index) =>
    unionLayout.addVariant(index, variant, variant.property || ''),
  );
  return unionLayout;
}
