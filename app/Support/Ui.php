<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\HtmlString;

class Ui
{
    public const STATUSES = ['menunggu' => 'Menunggu', 'dikonfirmasi' => 'Dikonfirmasi', 'diproses' => 'Diproses', 'dikirim' => 'Dikirim', 'selesai' => 'Selesai', 'dibatalkan' => 'Dibatalkan'];

    public static function icon(string $name): HtmlString
    {
        static $paths;
        $paths ??= json_decode(file_get_contents(resource_path('icons.json')), true);
        $path = $paths[$name] ?? $paths['box'];

        return new HtmlString('<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'.$path.'"/></svg>');
    }

    public static function art(Product $product): string
    {
        return $product->kategori === 'Baglog' ? 'baglog' : (str_contains(mb_strtolower($product->nama_produk), 'kuping') ? 'kuping' : 'tiram');
    }

    public static function money($amount): string
    {
        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }

    public static function code(string $prefix, $id): string
    {
        return $prefix.'-'.str_pad((string) $id, 3, '0', STR_PAD_LEFT);
    }

    public static function age(int $months): string
    {
        return $months < 12 ? $months.' bln' : intdiv($months, 12).' th'.($months % 12 ? ' '.($months % 12).' bln' : '');
    }
}
