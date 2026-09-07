<?php

namespace Database\Factories\Product;

use App\Models\Product\UnitOfMeasure;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UnitOfMeasure>
 */
class UnitOfMeasureFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $units = [
            ['name' => 'Piece', 'code' => 'PCS', 'description' => 'Individual item'],
            ['name' => 'Box', 'code' => 'BOX', 'description' => 'Boxed quantity'],
            ['name' => 'Kilogram', 'code' => 'KG', 'description' => 'Weight in kilograms'],
            ['name' => 'Gram', 'code' => 'G', 'description' => 'Weight in grams'],
            ['name' => 'Litre', 'code' => 'L', 'description' => 'Volume in litres'],
            ['name' => 'Metre', 'code' => 'M', 'description' => 'Length in metres'],
            ['name' => 'Pack', 'code' => 'PK', 'description' => 'Multi-unit pack'],
            ['name' => 'Dozen', 'code' => 'DZ', 'description' => 'Set of twelve'],
        ];

        $randomUnit = fake()->unique()->randomElement($units);

        return [
            'name' => $randomUnit['name'],
            'code' => $randomUnit['code'],
            'description' => $randomUnit['description'],
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
