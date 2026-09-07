<?php

namespace Database\Factories\Product;

use App\Models\Product\ProductCategory;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            ['name' => 'Electronics', 'description' => 'Consumer electronics and gadgets'],
            ['name' => 'Computers', 'description' => 'Laptops, desktops and components'],
            ['name' => 'Mobile Phones', 'description' => 'Smartphones and accessories'],
            ['name' => 'Home Appliances', 'description' => 'Kitchen and household appliances'],
            ['name' => 'Furniture', 'description' => 'Indoor and outdoor furniture'],
            ['name' => 'Clothing', 'description' => 'Apparel for all ages'],
            ['name' => 'Footwear', 'description' => 'Shoes, boots and sandals'],
            ['name' => 'Books', 'description' => 'Printed and digital publications'],
            ['name' => 'Sports & Outdoors', 'description' => 'Fitness and outdoor equipment'],
            ['name' => 'Groceries', 'description' => 'Everyday food and household items'],
        ];

        $randomCategory = fake()->unique()->randomElement($categories);

        return [
            'name' => $randomCategory['name'],
            'slug' => Str::slug($randomCategory['name']),
            'description' => $randomCategory['description'],
            // Parent is wired up by the seeder once the rows exist.
            'parent_id' => null,
            'is_active' => true,
            'created_by' => $this->getUserId(),
        ];
    }

    public function getUserId()
    {
        static $userIds = null;
        if ($userIds === null) {
            $userIds = User::pluck('id')->toArray();
        }

        return fake()->randomElement($userIds);
    }
}
