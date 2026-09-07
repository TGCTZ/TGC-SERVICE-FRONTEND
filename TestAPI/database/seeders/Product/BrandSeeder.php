<?php

namespace Database\Seeders\Product;

use App\Models\Product\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        Brand::factory()->count(12)->create();
    }
}
