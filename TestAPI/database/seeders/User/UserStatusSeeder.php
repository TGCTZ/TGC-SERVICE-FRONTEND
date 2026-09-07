<?php

namespace Database\Seeders\User;

use App\Models\User\UserStatus;
use Illuminate\Database\Seeder;

class UserStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        UserStatus::factory()->count(5)->create();
    }
}
