import {blob, Layout, LayoutObject, Structure, u8, UInt, union} from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

class PublicKeyLayout extends Layout<LayoutObject> {
  private layout: Layout<LayoutObject>

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


class U64Layout extends Layout<BN | number> {
  private layout
  private toNumber: boolean
  private signed: boolean

  constructor(property: string, signed: boolean, toNumber: boolean) {
    const layout = blob(8)
    super(layout.span, property)
    this.layout = layout
    this.toNumber = toNumber
    this.signed = signed
  }

  getSpan(b: Uint8Array, offset?: number) {
    return this.layout.getSpan(b, offset)
  }

  decode(b: Uint8Array, offset?: number): BN | number {
    let bn = new BN(this.layout.decode(b, offset), 10, 'le');
    if (this.signed) {
      bn = bn.fromTwos(this.span * 8).clone();
    }
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
export const uint64 = (property: string, toNumber = false) => new U64Layout(property, false, toNumber)
export const int64 = (property: string, toNumber = false) => new U64Layout(property, true, toNumber)


export const rustEnum = (
    variants: Structure<UInt>[],
    property: string,
) => {
  const unionLayout = union(<any>u8(), blob(0), property);

  variants.forEach((variant, index) =>
      unionLayout.addVariant(index, variant, variant.property || ''),
  );
  return unionLayout;
}


class BoolLayout extends Layout<boolean> {
  private layout: LayoutObject

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
