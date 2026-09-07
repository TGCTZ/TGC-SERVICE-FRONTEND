<?php

namespace Database\Seeders\User;

use App\Models\User\Gender;
use Illuminate\Database\Seeder;

class GenderSeeder extends Seeder
{
    public function run(): void
    {
        Gender::factory()->count(5)->create();
    }
}
