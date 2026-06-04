<?php

/**
 * EnseignantOwnerMiddleware.php — Protection des données personnelles des enseignants
 *
 * Ce middleware garantit qu'un enseignant connecté ne peut consulter
 * QUE SES PROPRES données, et non celles d'autres enseignants.
 *
 * Il s'applique aux routes comme :
 *   GET /enseignants/{idEns}
 *   GET /exports/enseignants/{idEns}/pdf
 *
 * RÈGLES D'ACCÈS :
 * - Administrateur ou Secrétaire → accès TOTAL (peut voir tous les enseignants)
 * - Enseignant → accès LIMITÉ à ses propres données ({idEns} = son propre id_ens)
 *
 * EXEMPLE : L'enseignant avec id_ens=5 peut accéder à /enseignants/5
 * mais PAS à /enseignants/3 (qui appartient à un autre enseignant).
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnseignantOwnerMiddleware
{
    /**
     * Vérifie que l'enseignant accède uniquement à ses propres données.
     *
     * @param  Request  $request  - La requête HTTP contenant l'utilisateur connecté
     * @param  Closure  $next  - La suite du traitement si l'accès est autorisé
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        // Récupérer l'id de l'enseignant ciblé dans l'URL ({idEns})
        $idEns = $request->route('idEns');

        // Administrateurs et secrétaires peuvent accéder à n'importe quel enseignant
        if (isset($user->user_log_adm) || isset($user->user_log_sp)) {
            return $next($request);
        }

        // Un enseignant ne peut accéder qu'à ses propres données
        if (isset($user->id_ens) && $user->id_ens == $idEns) {
            return $next($request);
        }

        // Tentative d'accès aux données d'un autre enseignant → 403
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }
}
