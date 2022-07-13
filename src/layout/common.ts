import { blob, Layout, Structure, u8, union } from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

class PublicKeyLayout extends Layout<PublicKey> {
  private layout: Layout<Uint8Array>

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


class U64Layout extends Layout<BN> {
  private layout: Layout<Uint8Array>
  private signed: boolean

  constructor(property: string, signed: boolean) {
    const layout = blob(8)
    super(layout.span, property)
    this.layout = layout /* A function that takes a `Structure` and returns a `Layout`. */
    this.signed = signed
  }

  getSpan(b: Uint8Array, offset?: number) {
    return this.layout.getSpan(b, offset)
  }

  decode(b: Uint8Array, offset?: number): BN  {
    let bn = new BN(this.layout.decode(b, offset), 10, 'le');
    if (this.signed) {
      bn = bn.fromTwos(this.span * 8).clone();
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
export const uint64 = (property: string) => new U64Layout(property, false)
export const int64 = (property: string) => new U64Layout(property, true)


export const rustEnum = (
  variants: Structure<any>[],
  property: string,
) => {
  const unionLayout = union(<any>u8(), blob(0), property);

  variants.forEach((variant, index) =>
    unionLayout.addVariant(index, variant, variant.property || ''),
  );
  return unionLayout;
}


class BoolLayout extends Layout<boolean> {
  private layout: Layout<any>

  constructor(property: string) {
    const layout = blob(1)
    super(layout.span, property)
    this.layout = layout
  }

  getSpan(b: Uint8Array, offset?: number) {
    return this.layout.getSpan(b, offset)
  }

  decode(b: Uint8Array, offset?: number): boolean {
    const value = this.layout.decode(b, offset)
    return !!value[0]
  }

  encode(src: boolean, b: Uint8Array, offset: number): number {
    return this.layout.encode(src ? 1 : 0, b, offset);
  }
}


export const bool = (property: string) => new BoolLayout(property)
