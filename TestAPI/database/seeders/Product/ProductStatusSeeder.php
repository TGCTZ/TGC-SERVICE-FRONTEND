<?php

namespace Database\Seeders\Product;

use App\Models\Product\ProductStatus;
use Illuminate\Database\Seeder;

class ProductStatusSeeder extends Seeder
{
    public function run(): void
    {
        ProductStatus::factory()->count(5)->create();
    }
}
