<x-layout page="login" title="Masuk" shell="auth">
<main class="auth-main" id="app-main" tabindex="-1"><section class="auth-card" aria-labelledby="login-heading"><div class="auth-logo">{{ \App\Support\Ui::icon('mushroom') }}</div><h1 id="login-heading">Masuk ke JamurTani</h1><p class="auth-subtitle">Masuk ke akun Anda</p>
<form method="POST" action="{{ route('login.submit') }}">@csrf<input type="hidden" name="_modal" value="login">
<div class="field"><label for="username">Username</label><div class="input-wrap">{{ \App\Support\Ui::icon('user') }}<input class="input" id="username" name="username" value="{{ old('username') }}" placeholder="Masukkan username" autocomplete="username" required autofocus></div></div>
<div class="field"><label for="password">Kata Sandi</label><div class="input-wrap">{{ \App\Support\Ui::icon('lock') }}<input class="input" id="password" name="password" type="password" placeholder="Masukkan kata sandi" autocomplete="current-password" required></div></div>
<label class="check-label"><input type="checkbox" name="remember" value="1" @checked(old('remember'))> Ingat saya</label><x-errors/><button class="button" type="submit">{{ \App\Support\Ui::icon('login') }}Masuk</button></form>
<p class="auth-footer">Belum punya akun? <a href="{{ route('register') }}">Daftar</a></p></section></main>
</x-layout>
