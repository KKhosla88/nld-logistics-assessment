import { AppDataSource } from '../data-source';
import { Product } from '../entities/product.entity';

const products: Array<Pick<Product, 'name' | 'sku' | 'stockQty' | 'price'>> = [
  { name: 'Corrugated Shipping Box - Small', sku: 'BOX-SM-001', stockQty: 250, price: '2.50' },
  { name: 'Corrugated Shipping Box - Large', sku: 'BOX-LG-001', stockQty: 150, price: '5.75' },
  { name: 'Heavy Duty Packing Tape', sku: 'TAPE-HD-001', stockQty: 300, price: '3.25' },
  { name: 'Bubble Wrap Roll - 10m', sku: 'WRAP-BB-010', stockQty: 80, price: '12.99' },
  { name: 'Wooden Shipping Pallet', sku: 'PALLET-WD-001', stockQty: 40, price: '28.50' },
  { name: 'Stretch Film Roll', sku: 'FILM-ST-001', stockQty: 120, price: '9.40' },
  { name: 'Fragile Label Pack', sku: 'LABEL-FR-100', stockQty: 500, price: '4.20' },
  { name: 'Document Enclosed Wallet', sku: 'DOC-WALLET-050', stockQty: 200, price: '6.80' }
];

async function seedProducts(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);

      for (const product of products) {
        await repository.upsert(product, ['sku']);
      }
    });

    console.log(`Seeded ${products.length} products.`);
  } finally {
    await AppDataSource.destroy();
  }
}

seedProducts().catch((error: unknown) => {
  console.error('Product seed failed.', error);
  process.exitCode = 1;
});

