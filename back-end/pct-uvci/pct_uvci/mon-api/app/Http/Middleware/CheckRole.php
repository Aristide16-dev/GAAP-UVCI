<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        foreach ($roles as $role) {
            if ($user?->tokenCan($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Acces refuse pour ce profil.',
        ], 403);
    }
}
