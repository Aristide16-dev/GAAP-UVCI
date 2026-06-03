<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEnseignantOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->tokenCan('enseignant')) {
            return $next($request);
        }

        $idEns = $request->route('idEns');

        if ((int) $user->id_ens === (int) $idEns) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Vous ne pouvez consulter que vos propres donnees.',
        ], 403);
    }
}
