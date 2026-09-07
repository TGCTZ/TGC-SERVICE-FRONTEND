<?php

namespace Database\Factories\Product;

use App\Models\Product\ProductStatus;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductStatus>
 */
class ProductStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = [
            [
                'name' => 'Draft',
                'description' => 'Not yet published to the storefront',
                'color' => '#94a3b8',
            ],
            [
                'name' => 'Published',
                'description' => 'Visible and available for sale',
                'color' => '#22c55e',
            ],
            [
                'name' => 'Out of Stock',
                'description' => 'Visible but temporarily unavailable',
                'color' => '#f59e0b',
            ],
            [
                'name' => 'Discontinued',
                'description' => 'No longer sold',
                'color' => '#ef4444',
            ],
            [
                'name' => 'Archived',
                'description' => 'Hidden from listings and reporting',
                'color' => '#6b7280',
            ],
        ];

        $randomStatus = fake()->unique()->randomElement($statuses);

        return [
            'name' => $randomStatus['name'],
            'description' => $randomStatus['description'],
            'color' => $randomStatus['color'],
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
