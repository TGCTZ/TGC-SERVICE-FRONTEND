<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;

class ProductImageRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Accept a single file or a batch; send as multipart/form-data.
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'images' => 'images',
            'images.*' => 'image',
            'alt_text' => 'alt text',
        ];
    }
}
