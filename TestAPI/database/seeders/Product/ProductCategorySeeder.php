<?php

namespace Database\Seeders\Product;

use App\Models\Product\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = ProductCategory::factory()->count(10)->create();

        // Nest a few categories under others so the UI has a real tree to
        // render (cascading selects, breadcrumbs) rather than a flat list.
        $parents = $categories->take(4);
        $children = $categories->skip(4);

        $children->each(function (ProductCategory $category) use ($parents): void {
            $category->update(['parent_id' => $parents->random()->id]);
        });
    }
}
