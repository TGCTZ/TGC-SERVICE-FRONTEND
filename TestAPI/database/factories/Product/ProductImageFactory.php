<?php

namespace Database\Factories\Product;

use App\Models\Product\Product;
use App\Models\Product\ProductImage;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * No real file is written — the seeded path points at a placeholder service
     * so the UI has something to render without shipping binary fixtures.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => $this->getProductId(),
            'image_path' => 'products/gallery/placeholder-'.fake()->numberBetween(1, 20).'.jpg',
            'original_image_name' => fake()->slug(2).'.jpg',
            'image_size' => fake()->numberBetween(20_000, 900_000),
            'mime_type' => 'image/jpeg',
            'alt_text' => fake()->sentence(4),
            'sort_order' => fake()->numberBetween(1, 5),
            'is_primary' => false,
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

    public function getProductId()
    {
        static $ids = null;
        if ($ids === null) {
            $ids = Product::pluck('id')->toArray();
        }

        return fake()->randomElement($ids);
    }
}
