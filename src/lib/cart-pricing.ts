export const FREE_SHIPPING_THRESHOLD = 350;
export const STANDARD_SHIPPING_FEE = 50;

export function getShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}
