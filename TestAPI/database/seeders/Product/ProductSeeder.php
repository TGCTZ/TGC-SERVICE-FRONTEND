<?php

namespace Database\Seeders\Product;

use App\Models\Product\Product;
use App\Models\Product\Tag;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // A deliberately large set so pagination, sorting and filtering are
        // genuinely exercised by the frontend data table.
        $products = Product::factory()->count(250)->create();

        $tagIds = Tag::pluck('id');

        if ($tagIds->isEmpty()) {
            return;
        }

        $products->each(function (Product $product) use ($tagIds): void {
            $product->tags()->sync(
                $tagIds->random(random_int(1, min(4, $tagIds->count())))->all()
            );
        });
    }
}
