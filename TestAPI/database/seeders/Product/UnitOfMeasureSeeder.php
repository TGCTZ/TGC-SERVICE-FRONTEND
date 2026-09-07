<?php

namespace Database\Seeders\Product;

use App\Models\Product\UnitOfMeasure;
use Illuminate\Database\Seeder;

class UnitOfMeasureSeeder extends Seeder
{
    public function run(): void
    {
        UnitOfMeasure::factory()->count(8)->create();
    }
}
