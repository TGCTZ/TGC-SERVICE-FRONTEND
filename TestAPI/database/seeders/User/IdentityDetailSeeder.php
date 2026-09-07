<?php

namespace Database\Seeders\User;

use App\Models\User\IdentityDetail;
use Illuminate\Database\Seeder;

class IdentityDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        IdentityDetail::factory()->count(10)->create();
    }
}
