<?php

namespace Database\Seeders\Product;

use App\Models\Product\Tag;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        Tag::factory()->count(12)->create();
    }
}
