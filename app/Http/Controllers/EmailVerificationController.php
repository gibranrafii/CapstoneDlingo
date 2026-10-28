<?php

namespace App\Http\Controllers;

use App\Services\SecurityEvent;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function notice(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        return view('auth.verify-email');
    }

    public function verify(EmailVerificationRequest $request)
    {
        $request->fulfill();
        SecurityEvent::record('email.verified', ['target_id' => $request->user()->id_user]);

        return redirect()->route('dashboard')->with('success', 'Email berhasil diverifikasi. Anda dapat membuat pesanan.');
    }

    public function resend(Request $request)
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return back()->with('success', 'Permintaan tautan verifikasi diproses. Periksa email Anda; jika belum tiba, coba kembali nanti.');
    }
}
