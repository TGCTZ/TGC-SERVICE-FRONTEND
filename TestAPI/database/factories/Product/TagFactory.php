<?php

namespace Database\Factories\Product;

use App\Models\Product\Tag;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tag>
 */
class TagFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tags = [
            'New Arrival', 'Best Seller', 'On Sale', 'Clearance', 'Limited Edition',
            'Eco Friendly', 'Handmade', 'Imported', 'Refurbished', 'Bundle',
            'Premium', 'Budget',
        ];

        $randomTag = fake()->unique()->randomElement($tags);

        return [
            'name' => $randomTag,
            'slug' => Str::slug($randomTag),
            'description' => fake()->sentence(6),
            'color' => fake()->hexColor(),
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
