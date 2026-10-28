<x-layout page="login" :title="$staff?'Login Pengelola':'Masuk'" shell="auth">
<main class="login-stage" id="app-main" tabindex="-1">
    <header class="login-topbar">
        <a class="login-back" href="{{ route('store') }}"><span aria-hidden="true">←</span> <span>Kembali ke katalog</span></a>
        <a class="login-mobile-brand" href="{{ route('store') }}">{{ \App\Support\Ui::icon('mushroom') }}JamurTani</a>
        <span class="login-topbar-note">JamurTani <span aria-hidden="true">/</span> Akses akun</span>
    </header>
    <div class="login-frame">
        <aside class="login-visual" aria-label="Tentang JamurTani">
            <a class="login-brand" href="{{ route('store') }}">{{ \App\Support\Ui::icon('mushroom') }}JamurTani</a>
            <p class="login-location">Desa Dlingo · Imogiri</p>
            <img class="login-art" src="{{ asset('images/auth-fold.svg') }}" width="600" height="350" alt="" fetchpriority="low">
            <div class="login-story">
                <p class="login-tagline">{{ $staff?'Kelola usaha.':'Hasil lokal.' }}<br>{{ $staff?'Tumbuh bersama.':'Pilihan lebih dekat.' }}</p>
                <p class="login-description">{{ $staff?'Produk, pesanan, dan budidaya terhubung dalam satu tempat.':'Temukan jamur segar dan kebutuhan budidaya dari petani Desa Dlingo.' }}</p>
            </div>
            <span class="login-visual-footer">{{ $staff?'Ruang kerja pengelola':'Dari petani lokal, untuk Anda' }}</span>
        </aside>
        <section class="login-form-panel" aria-labelledby="login-heading">
            <div class="login-heading">
                <p class="login-eyebrow">{{ $staff?'Portal pengelola':'Akun pembeli' }}</p>
                <h1 id="login-heading">{{ $staff?'Login Pengelola':'Masuk ke JamurTani' }}</h1>
                <p>{{ $staff?'Selamat datang kembali. Siap mengelola hari ini?':'Selamat datang kembali. Temukan pilihan lokal Anda.' }}</p>
            </div>
            <form class="login-form" method="POST" action="{{ route($staff?'admin.login.submit':'login.submit') }}">
                @csrf
                <input type="hidden" name="_modal" value="login">
                <x-errors/>
                <div class="field">
                    <label for="username">Username atau email</label>
                    <div class="input-wrap">
                        {{ \App\Support\Ui::icon('user') }}
                        <input class="input" id="username" name="username" value="{{ old('username') }}" placeholder="Masukkan username atau email" autocomplete="username" autocapitalize="none" spellcheck="false" required>
                    </div>
                </div>
                <div class="field login-password-field">
                    <label for="password">Kata sandi</label>
                    <div class="input-wrap">
                        {{ \App\Support\Ui::icon('lock') }}
                        <input class="input" id="password" name="password" type="password" placeholder="Masukkan kata sandi" autocomplete="current-password" required>
                        <button class="login-password-toggle" type="button" data-password-toggle aria-controls="password" aria-label="Tampilkan kata sandi" aria-pressed="false" hidden>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="login-eye-slash" d="m3 3 18 18"/></svg>
                        </button>
                    </div>
                </div>
                <div class="login-options">
                    @if($staff)
                        <span class="login-access-note">Petani &amp; administrator</span>
                    @else
                        <label class="check-label"><input type="checkbox" name="remember" value="1" @checked(old('remember'))> Ingat saya</label>
                    @endif
                    <a href="{{ route('password.request') }}">Lupa kata sandi?</a>
                </div>
                <button class="button login-submit" type="submit">Masuk <span aria-hidden="true">→</span></button>
            </form>
            <div class="login-divider"><span>atau</span></div>
            <a class="button secondary login-alternative" href="{{ route($staff?'login':'register') }}">{{ $staff?'Masuk sebagai pembeli':'Buat akun pembeli' }}</a>
        </section>
    </div>
    <footer class="login-footer">
        <p>@if($staff)Akun pengelola dibuat oleh administrator.@else Anda pengelola usaha? <a href="{{ route('admin.login') }}">Login pengelola <span aria-hidden="true">→</span></a>@endif</p>
        <span>JamurTani · Desa Dlingo</span>
    </footer>
</main>
</x-layout>
