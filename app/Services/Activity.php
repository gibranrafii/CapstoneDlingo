<?php
namespace App\Services;
use App\Models\User;
use Illuminate\Support\Facades\DB;
class Activity {
    public static function record(string $message,string $category,?User $actor=null): void {
        $actor ??= auth()->user();
        DB::table('activity_logs')->insert(['user_id'=>$actor?->id_user,'actor'=>$actor?->nama??'Sistem','category'=>$category,'message'=>mb_substr($message,0,255),'created_at'=>now()]);
    }
}
