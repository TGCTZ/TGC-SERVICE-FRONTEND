<?php

namespace Database\Factories\Product;

use App\Models\Product\Brand;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Brand>
 */
class BrandFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $brands = [
            ['name' => 'Acme', 'country' => 'United States'],
            ['name' => 'Globex', 'country' => 'Germany'],
            ['name' => 'Initech', 'country' => 'United States'],
            ['name' => 'Umbrella', 'country' => 'Japan'],
            ['name' => 'Soylent', 'country' => 'Netherlands'],
            ['name' => 'Vehement', 'country' => 'United Kingdom'],
            ['name' => 'Massive Dynamic', 'country' => 'Canada'],
            ['name' => 'Stark Industries', 'country' => 'United States'],
            ['name' => 'Wayne Enterprises', 'country' => 'United States'],
            ['name' => 'Cyberdyne', 'country' => 'South Korea'],
            ['name' => 'Tyrell', 'country' => 'France'],
            ['name' => 'Wonka', 'country' => 'Switzerland'],
        ];

        $randomBrand = fake()->unique()->randomElement($brands);

        return [
            'name' => $randomBrand['name'],
            'slug' => Str::slug($randomBrand['name']),
            'description' => fake()->sentence(10),
            'website_url' => 'https://'.Str::slug($randomBrand['name']).'.example.com',
            'country' => $randomBrand['country'],
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
