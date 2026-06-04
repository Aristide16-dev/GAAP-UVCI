<?php

/**
 * RoleMiddleware.php — Contrôle d'accès par rôle
 *
 * Ce middleware vérifie que l'utilisateur connecté a le rôle requis
 * pour accéder à la route demandée.
 *
 * Il est déclaré dans routes/api.php comme "role:administrateur,secretaire"
 * par exemple, et s'exécute APRÈS le middleware auth:sanctum
 * (l'utilisateur est donc forcément connecté quand on arrive ici).
 *
 * DÉTECTION DU RÔLE :
 * Le rôle n'est pas stocké dans un champ dédié mais détecté par
 * "field sniffing" : on regarde quel login est présent sur le modèle.
 * - user_log_adm → administrateur
 * - user_log_sp  → secretaire
 * - user_log_ens → enseignant
 *
 * EXEMPLE d'utilisation dans api.php :
 *   Route::middleware('role:administrateur,secretaire')->group(...)
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Vérifie que l'utilisateur connecté a l'un des rôles autorisés.
     *
     * @param  Request  $request  - La requête HTTP entrante
     * @param  Closure  $next  - La fonction à appeler si l'accès est autorisé
     * @param  string[]  $roles  - Les rôles autorisés (peut en avoir plusieurs)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Si pas d'utilisateur connecté → 401 (normalement déjà géré par auth:sanctum)
        if (! $user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Détecter le type de compte en cherchant le champ de login caractéristique
        $userType = null;
        if (isset($user->user_log_adm)) {
            $userType = 'administrateur';
        } elseif (isset($user->user_log_sp)) {
            $userType = 'secretaire';
        } elseif (isset($user->user_log_ens)) {
            $userType = 'enseignant';
        }

        // Si le rôle détecté n'est pas dans la liste des rôles autorisés → 403
        if (! in_array($userType, $roles)) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Rôle autorisé → continuer vers le contrôleur
        return $next($request);
    }
}
