import type { OrderRequest } from "@/lib/orders";

/**
 * Live demo (lib/demo.ts): the demo customer is one account shared by every visitor, and
 * its orders are shown to later visitors, the demo admin and the demo rider. So a demo
 * order never stores any of the address someone typed, not even the city (it is free text
 * and often prefilled from the visitor's location): it gets this sample address instead,
 * and no delivery note. The checkout routes still validate the typed address first, so
 * their error messages don't change.
 */
export function demoShippingAddress(): OrderRequest["shippingAddress"] {
  return { street: "House 12, Road 5 (demo)", city: "Dhaka", zipCode: "1213", phone: "01700000000" };
}
