<?php

/**
 * AdminUserController.php — Gestion des comptes utilisateurs par l'administrateur
 *
 * Ce contrôleur permet à l'administrateur (et à la secrétaire dans certains cas)
 * de gérer les comptes des trois types d'utilisateurs : administrateurs,
 * secrétaires et enseignants.
 *
 * ROUTES ASSOCIÉES (voir routes/api.php) :
 * - GET    /admin/users             → index()       : liste tous les comptes
 * - POST   /admin/users             → store()       : créer un nouveau compte
 * - PUT    /admin/users/{id}        → update()      : modifier un compte
 * - PATCH  /admin/users/{id}/status → toggleStatus(): activer/désactiver
 * - DELETE /admin/users/{id}        → destroy()     : supprimer un compte
 *
 * PARTICULARITÉ DE CE CONTRÔLEUR :
 * La méthode index() FUSIONNE les 3 tables (administrateur, secretaire_principal,
 * enseignants) avec leurs champs normalisés (id, nom, email, role, status)
 * en une seule collection unifiée pour le tableau de bord admin.
 *
 * Les méthodes store() et update() délèguent à des méthodes privées spécifiques
 * selon le rôle du compte à créer/modifier.
 */

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = collect();

        $admins = DB::table('administrateur')
            ->select(
                'user_log_adm as id',
                'user_log_adm as login',
                DB::raw("CASE WHEN nom_adm IS NOT NULL THEN TRIM(COALESCE(pren_adm,'') || ' ' || nom_adm) ELSE user_log_adm END as nom"),
                DB::raw("COALESCE(NULLIF(email_adm,''), 'admin@uvci.edu.ci') as email"),
                DB::raw("'administrateur' as role"),
                'status',
                'last_login_at'
            )
            ->get();

        $secretaires = DB::table('secretaire_principal')
            ->select(
                'user_log_sp as id',
                'user_log_sp as login',
                DB::raw("CONCAT(nom_sp, ' ', pren_sp) as nom"),
                'email_sp as email',
                DB::raw("'secretaire' as role"),
                'status',
                'last_login_at'
            )
            ->get();

        $enseignants = DB::table('enseignants')
            ->select(
                'user_log_ens as id',
                'user_log_ens as login',
                DB::raw("CONCAT(nom_ens, ' ', pren_ens) as nom"),
                'email_ens as email',
                DB::raw("'enseignant' as role"),
                'status',
                'last_login_at'
            )
            ->get();

        $users = $admins->merge($secretaires)->merge($enseignants);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $role = $request->input('role');

        return match ($role) {
            'administrateur' => $this->createAdministrateur($request),
            'secretaire' => $this->createSecretaire($request),
            'enseignant' => $this->createEnseignant($request),
            default => response()->json([
                'success' => false,
                'message' => 'Rôle invalide',
            ], 422),
        };
    }

    public function update(Request $request, $id): JsonResponse
    {
        $role = $request->input('role');

        // Detect which table actually owns this user
        $actualRole = null;
        if (DB::table('administrateur')->where('user_log_adm', $id)->exists()) {
            $actualRole = 'administrateur';
        } elseif (DB::table('secretaire_principal')->where('user_log_sp', $id)->exists()) {
            $actualRole = 'secretaire';
        } elseif (DB::table('enseignants')->where('user_log_ens', $id)->exists()) {
            $actualRole = 'enseignant';
        }

        if (! $actualRole) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
            ], 404);
        }

        // If role change requested, refuse — must delete and recreate
        if ($role && $role !== $actualRole) {
            return response()->json([
                'success' => false,
                'message' => 'Le changement de rôle n\'est pas supporté. Veuillez supprimer ce compte et en créer un nouveau avec le rôle souhaité.',
            ], 422);
        }

        return match ($actualRole) {
            'administrateur' => $this->updateAdministrateur($request, $id),
            'secretaire' => $this->updateSecretaire($request, $id),
            'enseignant' => $this->updateEnseignant($request, $id),
        };
    }

    public function destroy($id): JsonResponse
    {
        try {
            $deleted = DB::table('administrateur')->where('user_log_adm', $id)->delete();
            if (! $deleted) {
                $deleted = DB::table('secretaire_principal')->where('user_log_sp', $id)->delete();
            }
            if (! $deleted) {
                $deleted = DB::table('enseignants')->where('user_log_ens', $id)->delete();
            }
        } catch (QueryException $e) {
            // Code 23503 = violation de clé étrangère PostgreSQL (l'utilisateur a des données liées)
            // Code 1451 = violation de clé étrangère MySQL
            if (in_array($e->getCode(), ['23503', '1451'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cet utilisateur : il possède des données liées (paramètres, activités, cours). Supprimez d\'abord ces données.',
                ], 409);
            }
            throw $e;
        }

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Utilisateur introuvable',
        ], 404);
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        // Valider que status ne peut être que ACTIF ou INACTIF
        $validated = $request->validate([
            'status' => 'required|in:ACTIF,INACTIF',
        ]);
        $status = $validated['status'];

        $updated = DB::table('administrateur')
            ->where('user_log_adm', $id)
            ->update(['status' => $status]);

        if (! $updated) {
            $updated = DB::table('secretaire_principal')
                ->where('user_log_sp', $id)
                ->update(['status' => $status]);
        }

        if (! $updated) {
            $updated = DB::table('enseignants')
                ->where('user_log_ens', $id)
                ->update(['status' => $status]);
        }

        if ($updated) {
            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour',
                'data' => ['id' => $id, 'status' => $status],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Utilisateur introuvable',
        ], 404);
    }

    private function createAdministrateur(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => 'required|string|max:50|unique:administrateur,user_log_adm',
            'nom' => 'required|string|max:100',
            'password' => 'required|string|min:6',
        ]);

        $data = [
            'user_log_adm' => $validated['login'],
            'user_pasw_adm' => Hash::make($validated['password']),
            'ann_aca' => date('Y'),
            'rol_usr' => 'Administrateur',
            'para_cal' => 0,
            'coef_niv' => 0,
            'taux_hor' => 0,
            'status' => 'ACTIF',
        ];

        DB::table('administrateur')->insert($data);

        return response()->json([
            'success' => true,
            'message' => 'Administrateur créé avec succès',
            'data' => [
                'id' => $validated['login'],
                'login' => $validated['login'],
                'nom' => $validated['nom'],
                'email' => 'admin@uvci.edu.ci',
                'role' => 'administrateur',
                'status' => 'ACTIF',
            ],
        ], 201);
    }

    private function createSecretaire(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => 'required|string|max:50|unique:secretaire_principal,user_log_sp',
            'nom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:secretaire_principal,email_sp',
            'password' => 'required|string|min:6',
        ]);

        $nameParts = explode(' ', $validated['nom'], 2);
        $nom = $nameParts[0] ?? $validated['nom'];
        $prenom = $nameParts[1] ?? '';

        $adminLog = DB::table('administrateur')->value('user_log_adm');

        $data = [
            'user_log_sp' => $validated['login'],
            'user_log_adm' => $adminLog,
            'user_pasw_sp' => Hash::make($validated['password']),
            'nom_sp' => $nom,
            'pren_sp' => $prenom,
            'email_sp' => $validated['email'],
            'rol_sp' => 'Secrétaire',
            'status' => 'ACTIF',
        ];

        DB::table('secretaire_principal')->insert($data);

        return response()->json([
            'success' => true,
            'message' => 'Secrétaire créé avec succès',
            'data' => [
                'id' => $validated['login'],
                'login' => $validated['login'],
                'nom' => $validated['nom'],
                'email' => $validated['email'],
                'role' => 'secretaire',
                'status' => 'ACTIF',
            ],
        ], 201);
    }

    private function createEnseignant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => 'required|string|max:50|unique:enseignants,user_log_ens',
            'nom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:enseignants,email_ens',
            'password' => 'required|string|min:6',
            'id_grade' => 'sometimes|integer|exists:grades,id_grade',
            'id_statut' => 'sometimes|integer|exists:statut,id_statut',
            'id_depart' => 'sometimes|integer|exists:departement,id_depart',
        ]);

        $nameParts = explode(' ', $validated['nom'], 2);
        $nom = $nameParts[0] ?? $validated['nom'];
        $prenom = $nameParts[1] ?? '';

        $adminLog = DB::table('administrateur')->value('user_log_adm');
        $secLog = DB::table('secretaire_principal')->value('user_log_sp'); // nullable

        // Use provided IDs or fall back to first existing referential record
        $idGrade = $validated['id_grade'] ?? DB::table('grades')->value('id_grade');
        $idStatut = $validated['id_statut'] ?? DB::table('statut')->value('id_statut');
        $idDepart = $validated['id_depart'] ?? DB::table('departement')->value('id_depart');

        if (! $idGrade || ! $idStatut || ! $idDepart) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez d\'abord configurer les grades, statuts et départements dans les référentiels.',
            ], 422);
        }

        $data = [
            'user_log_adm' => $adminLog,
            'user_log_sp' => $secLog,
            'user_log_ens' => $validated['login'],
            'user_pasw_ens' => Hash::make($validated['password']),
            'id_grade' => $idGrade,
            'id_statut' => $idStatut,
            'id_depart' => $idDepart,
            'nom_ens' => $nom,
            'pren_ens' => $prenom,
            'email_ens' => $validated['email'],
            'tel_ens' => '0000000000',
            'taux_hor_ens' => 0,
            'status' => 'ACTIF',
        ];

        DB::table('enseignants')->insert($data);

        return response()->json([
            'success' => true,
            'message' => 'Enseignant créé avec succès',
            'data' => [
                'id' => $validated['login'],
                'login' => $validated['login'],
                'nom' => $validated['nom'],
                'email' => $validated['email'],
                'role' => 'enseignant',
                'status' => 'ACTIF',
            ],
        ], 201);
    }

    private function updateAdministrateur(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150',
            'password' => 'sometimes|string|min:6',
        ]);

        $updateData = [];

        if (isset($validated['nom'])) {
            $nameParts = explode(' ', $validated['nom'], 2);
            $updateData['nom_adm'] = $nameParts[0] ?? $validated['nom'];
            $updateData['pren_adm'] = $nameParts[1] ?? '';
        }

        if (isset($validated['email'])) {
            $updateData['email_adm'] = $validated['email'];
        }

        if (isset($validated['password'])) {
            $updateData['user_pasw_adm'] = Hash::make($validated['password']);
        }

        if (! empty($updateData)) {
            DB::table('administrateur')
                ->where('user_log_adm', $id)
                ->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Administrateur mis à jour',
        ]);
    }

    private function updateSecretaire(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150',
            'password' => 'sometimes|string|min:6',
        ]);

        $updateData = [];

        if (isset($validated['nom'])) {
            $nameParts = explode(' ', $validated['nom'], 2);
            $updateData['nom_sp'] = $nameParts[0] ?? $validated['nom'];
            $updateData['pren_sp'] = $nameParts[1] ?? '';
        }

        if (isset($validated['email'])) {
            $updateData['email_sp'] = $validated['email'];
        }

        if (isset($validated['password'])) {
            $updateData['user_pasw_sp'] = Hash::make($validated['password']);
        }

        if (! empty($updateData)) {
            DB::table('secretaire_principal')
                ->where('user_log_sp', $id)
                ->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Secrétaire mis à jour',
        ]);
    }

    private function updateEnseignant(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150',
            'password' => 'sometimes|string|min:6',
        ]);

        $updateData = [];

        if (isset($validated['nom'])) {
            $nameParts = explode(' ', $validated['nom'], 2);
            $updateData['nom_ens'] = $nameParts[0] ?? $validated['nom'];
            $updateData['pren_ens'] = $nameParts[1] ?? '';
        }

        if (isset($validated['email'])) {
            $updateData['email_ens'] = $validated['email'];
        }

        if (isset($validated['password'])) {
            $updateData['user_pasw_ens'] = Hash::make($validated['password']);
        }

        if (! empty($updateData)) {
            DB::table('enseignants')
                ->where('user_log_ens', $id)
                ->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Enseignant mis à jour',
        ]);
    }
}
