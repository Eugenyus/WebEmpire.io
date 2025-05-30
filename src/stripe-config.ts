export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: StripeProduct[] = [
  {
    id: 'prod_SK0Va68s9b8KTf',
    priceId: 'price_1RPMUPFRTL7MRvIhgFE1fxre',
    name: 'Trading',
    description: 'Learn how to grow your income through smart investments tailored to your risk level.',
    mode: 'payment'
  },
  {
    id: 'prod_SK0VTnMTuormlA',
    priceId: 'price_1RPMUCFRTL7MRvIhCEpNEaFZ',
    name: 'No-Code Development',
    description: 'Build apps and websites effortlessly without writing a single line of code.',
    mode: 'payment'
  },
  {
    id: 'prod_SK0UyKIIE8EjqO',
    priceId: 'price_1RPMTIFRTL7MRvIhWTyH0912',
    name: 'Dropshipping',
    description: 'Build a hassle-free online store—no inventory needed',
    mode: 'payment'
  },
  {
    id: 'prod_SK0UeXpUlODDcT',
    priceId: 'price_1RPMT2FRTL7MRvIhFQM5fas2',
    name: 'Digital Products',
    description: 'Turn your ideas into income by crafting and selling digital products that inspire.',
    mode: 'payment'
  },
  {
    id: 'prod_SJz2WaG6CNbgSQ',
    priceId: 'price_1RPL4qFRTL7MRvIhM0TV79Wk',
    name: 'Affiliate Marketing',
    description: 'Learn how to earn commissions by promoting products you love.',
    mode: 'payment'
  }
];