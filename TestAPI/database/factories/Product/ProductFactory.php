<?php

namespace Database\Factories\Product;

use App\Models\Product\Brand;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Product\ProductStatus;
use App\Models\Product\UnitOfMeasure;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * Every column is populated (not just the required ones) so the frontend
     * has realistic values for each input type it needs to render.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucfirst(fake()->unique()->words(3, true));
        $price = fake()->randomFloat(2, 5, 5000);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####-???')),
            'barcode' => fake()->optional(0.7)->ean13(),

            'short_description' => fake()->sentence(10),
            'description' => fake()->paragraphs(3, true),

            'product_category_id' => $this->getProductCategoryId(),
            'brand_id' => fake()->optional(0.85)->passthrough($this->getBrandId()),
            'product_status_id' => $this->getProductStatusId(),
            'unit_of_measure_id' => $this->getUnitOfMeasureId(),

            'price' => $price,
            'cost_price' => round($price * fake()->randomFloat(2, 0.4, 0.8), 2),
            'discount_percentage' => fake()->optional(0.4)->randomFloat(2, 0, 40),
            'tax_rate' => fake()->randomElement([0, 5, 16, 18, 20]),
            // Single-currency app: the column exists, but nothing renders or
            // totals anything other than TZS.
            'currency' => 'TZS',

            'stock_quantity' => fake()->numberBetween(0, 500),
            'reorder_level' => fake()->numberBetween(5, 50),
            'weight' => fake()->randomFloat(3, 0.05, 40),
            'length' => fake()->randomFloat(2, 1, 200),
            'width' => fake()->randomFloat(2, 1, 200),
            'height' => fake()->randomFloat(2, 1, 200),
            'warranty_months' => fake()->randomElement([0, 6, 12, 24, 36]),
            'rating' => fake()->randomFloat(2, 1, 5),

            'is_active' => fake()->boolean(85),
            'is_featured' => fake()->boolean(20),
            'is_digital' => fake()->boolean(15),
            'requires_shipping' => fake()->boolean(85),

            'released_at' => fake()->dateTimeBetween('-3 years', 'now'),
            'available_from' => fake()->dateTimeBetween('-1 year', '+1 month'),
            'expiry_date' => fake()->optional(0.3)->dateTimeBetween('+1 month', '+3 years'),

            'specifications' => [
                'material' => fake()->randomElement(['Plastic', 'Metal', 'Wood', 'Glass']),
                'warranty' => fake()->randomElement(['6 months', '1 year', '2 years']),
                'origin' => fake()->country(),
            ],
            'metadata' => [
                'internal_note' => fake()->sentence(5),
                'reviewed' => fake()->boolean(),
            ],

            'color' => fake()->hexColor(),
            'website_url' => fake()->optional(0.5)->url(),
            'contact_email' => fake()->optional(0.5)->safeEmail(),

            // Images are attached by ProductImageSeeder; no file is generated here.
            'image_path' => null,
            'original_image_name' => null,
            'image_size' => null,
            'mime_type' => null,

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

    public function getProductCategoryId()
    {
        static $ids = null;
        if ($ids === null) {
            $ids = ProductCategory::pluck('id')->toArray();
        }

        return fake()->randomElement($ids);
    }

    public function getBrandId()
    {
        static $ids = null;
        if ($ids === null) {
            $ids = Brand::pluck('id')->toArray();
        }

        return fake()->randomElement($ids);
    }

    public function getProductStatusId()
    {
        static $ids = null;
        if ($ids === null) {
            $ids = ProductStatus::pluck('id')->toArray();
        }

        return fake()->randomElement($ids);
    }

    public function getUnitOfMeasureId()
    {
        static $ids = null;
        if ($ids === null) {
            $ids = UnitOfMeasure::pluck('id')->toArray();
        }

        return fake()->randomElement($ids);
    }
}
