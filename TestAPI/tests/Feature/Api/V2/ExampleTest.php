<?php

namespace Tests\Feature\Api\V2;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_health_endpoint_returns_successful_response(): void
    {
        $response = $this->get('/up');

        $response->assertSuccessful();
    }
}
