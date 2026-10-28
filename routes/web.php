<?php

use App\Http\Controllers\AccountRecoveryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuyerOrdersController;
use App\Http\Controllers\BuyersController;
use App\Http\Controllers\CaretakersController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\LivestockController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StoreController::class, 'index'])->name('store');
Route::get('/products/{id}', [StoreController::class, 'show'])->whereNumber('id')->name('products.show');
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', [AccountRecoveryController::class, 'requestForm'])->name('password.request');
    Route::post('/forgot-password', [AccountRecoveryController::class, 'send'])->name('password.email');
    Route::get('/reset-password/{token}', [AccountRecoveryController::class, 'resetForm'])->name('password.reset');
    Route::post('/reset-password', [AccountRecoveryController::class, 'reset'])->name('password.update');
    Route::get('/login', [AuthController::class, 'loginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
    Route::get('/admin/login', [AuthController::class, 'loginForm'])->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.submit');
    Route::get('/register', [AuthController::class, 'registerForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1')->name('register.submit');
});
Route::middleware('auth')->group(function () {
    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware('signed')->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])->name('verification.send');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', fn () => redirect()->route(auth()->user()->isManager() ? 'admin.dashboard' : 'dashboard.pembeli'))->name('dashboard');
    Route::middleware('can:buy')->group(function () {
        Route::get('/dashboard/pembeli', [DashboardController::class, 'buyer'])->name('dashboard.pembeli');
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::get('/orders/{id}', [OrdersController::class, 'show'])->whereNumber('id')->name('orders.show');
        Route::get('/cart', [CartController::class, 'index'])->name('cart');
        Route::post('/cart/{id}', [CartController::class, 'add'])->whereNumber('id')->name('cart.add')->block();
        Route::patch('/cart/{id}', [CartController::class, 'update'])->whereNumber('id')->name('cart.update')->block();
        Route::post('/checkout', [CartController::class, 'checkout'])->middleware('verified')->name('checkout')->block();
        Route::get('/orders', [BuyerOrdersController::class, 'index'])->name('buyer.orders');
        Route::delete('/orders/{id}', [OrdersController::class, 'cancel'])->whereNumber('id')->name('buyer.orders.cancel');
    });
    Route::middleware('can:manage-farm')->prefix('admin')->group(function () {
        Route::get('/', fn (DashboardController $dashboard) => auth()->user()->role === 'admin' ? $dashboard->admin() : $dashboard->farmer())->name('admin.dashboard');
        Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile');
        Route::put('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
        Route::get('/orders/{id}', [OrdersController::class, 'show'])->whereNumber('id')->name('admin.orders.show');
        Route::post('/farm/settings', [SettingsController::class, 'update'])->middleware('can:manage-users')->name('farm.update');
        foreach (['products' => ProductsController::class, 'buyers' => BuyersController::class, 'livestock' => LivestockController::class, 'caretakers' => CaretakersController::class] as $resource => $controller) {
            Route::get('/'.$resource, [$controller, 'index'])->name('manage.'.$resource.'.index');
            Route::post('/'.$resource, [$controller, 'store'])->name('manage.'.$resource.'.store');
            Route::put('/'.$resource.'/{id}', [$controller, 'update'])->whereNumber('id')->name('manage.'.$resource.'.update');
            Route::delete('/'.$resource.'/{id}', [$controller, 'destroy'])->whereNumber('id')->name('manage.'.$resource.'.destroy');
        }
        Route::get('/stock', [ProductsController::class, 'stock'])->name('manage.stock');
        Route::get('/orders', [OrdersController::class, 'index'])->name('manage.orders.index');
        Route::post('/orders', [OrdersController::class, 'store'])->name('manage.orders.store');
        Route::put('/orders/{id}/status', [OrdersController::class, 'transition'])->whereNumber('id')->name('manage.orders.status');
        Route::middleware('can:manage-users')->name('admin.')->group(function () {
            Route::get('/users', [UsersController::class, 'index'])->name('users.index');
            Route::post('/users', [UsersController::class, 'store'])->name('users.store');
            Route::put('/users/{id}', [UsersController::class, 'update'])->whereNumber('id')->name('users.update');
            Route::delete('/users/{id}', [UsersController::class, 'destroy'])->whereNumber('id')->name('users.destroy');
        });
    });
    // Preserve old bookmarks only; legacy mutation URLs are deliberately absent.
    Route::get('/manage/{path?}', fn ($path = '') => redirect('/admin'.($path ? '/'.$path : '')))->where('path', '(products|buyers|livestock|caretakers|stock|orders)')->middleware('can:manage-farm');
    Route::get('/dashboard/petani', fn () => redirect()->route('admin.dashboard'))->middleware('can:manage-farm')->name('dashboard.petani');
    Route::get('/dashboard/admin', fn () => redirect()->route('admin.dashboard'))->middleware('can:manage-users')->name('dashboard.admin');
});
