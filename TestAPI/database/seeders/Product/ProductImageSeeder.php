<?php

namespace Database\Seeders\Product;

use App\Models\Product\Product;
use App\Models\Product\ProductImage;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        // Only a subset gets a gallery, so the UI also has to handle products
        // with no images at all.
        Product::query()
            ->inRandomOrder()
            ->limit(120)
            ->get()
            ->each(function (Product $product): void {
                $count = random_int(1, 4);

                for ($i = 1; $i <= $count; $i++) {
                    ProductImage::factory()->create([
                        'product_id' => $product->id,
                        'sort_order' => $i,
                        'is_primary' => $i === 1,
                    ]);
                }
            });
    }
}
