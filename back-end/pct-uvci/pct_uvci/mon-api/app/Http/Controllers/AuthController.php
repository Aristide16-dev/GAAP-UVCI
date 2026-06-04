<?php

/**
 * AuthController.php — Gestion de l'authentification
 *
 * Ce contrôleur gère TOUT ce qui concerne la connexion et la déconnexion
 * dans l'application GAAP-UVCI pour les 3 types de comptes.
 *
 * FONCTIONNALITÉS :
 * - register() : créer un compte (admin, secrétaire ou enseignant)
 * - login()    : connexion avec génération d'un token Bearer Sanctum
 * - logout()   : déconnexion et invalidation du token
 * - updateProfile() : modification du profil de l'utilisateur connecté
 *
 * SÉCURITÉ :
 * - Les mots de passe sont hachés avec bcrypt (Hash::make / Hash::check)
 * - Un token unique est généré à chaque connexion (ancien token révoqué)
 * - La connexion est limitée à 10 tentatives/minute (throttle dans routes/api.php)
 * - Les connexions réussies et échouées sont enregistrées dans les logs Laravel
 * - Un compte INACTIF ne peut pas se connecter (code 403)
 *
 * STRUCTURE DE LA RÉPONSE DE CONNEXION :
 * {
 *   "message": "Connexion reussie.",
 *   "type": "administrateur",
 *   "token_type": "Bearer",
 *   "access_token": "1|abc123...",  ← À stocker côté frontend
 *   "data": { ...données du compte... }
 * }
 */

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Enseignant;
use App\Models\SecretairePrincipal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $type = $request->input('type');

        return match ($type) {
            'administrateur' => $this->registerAdministrateur($request),
            'secretaire' => $this->registerSecretaire($request),
            'enseignant' => $this->registerEnseignant($request),
            default => response()->json([
                'message' => 'Le type d utilisateur est invalide.',
                'errors' => [
                    'type' => ['Le type doit etre administrateur, secretaire ou enseignant.'],
                ],
            ], 422),
        };
    }

    public function login(Request $request): JsonResponse
    {
        $type = $request->input('type');

        return match ($type) {
            'administrateur' => $this->loginUser(
                $request,
                Administrateur::class,
                'user_log_adm',
                'user_pasw_adm',
                ['user_log_adm', 'nom_adm', 'pren_adm', 'email_adm', 'ann_aca', 'rol_usr'] // ← AJOUTER nom_adm, pren_adm, email_adm
            ),
            'secretaire' => $this->loginUser(
                $request,
                SecretairePrincipal::class,
                'user_log_sp',
                'user_pasw_sp',
                ['user_log_sp', 'user_log_adm', 'nom_sp', 'pren_sp', 'email_sp', 'rol_sp']
            ),
            'enseignant' => $this->loginUser(
                $request,
                Enseignant::class,
                'user_log_ens',
                'user_pasw_ens',
                [
                    'id_ens',
                    'user_log_ens',
                    'user_log_adm',
                    'user_log_sp',
                    'id_grade',
                    'id_statut',
                    'id_depart',
                    'nom_ens',
                    'pren_ens',
                    'email_ens',
                    'tel_ens',
                    'taux_hor_ens',
                ]
            ),
            default => response()->json([
                'message' => 'Le type d utilisateur est invalide.',
                'errors' => [
                    'type' => ['Le type doit etre administrateur, secretaire ou enseignant.'],
                ],
            ], 422),
        };
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        Log::info('Déconnexion', ['user' => $user?->getKey(), 'ip' => $request->ip()]);
        $user?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Deconnexion reussie.',
        ]);
    }

    private function registerAdministrateur(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['administrateur'])],
            'user_log_adm' => ['required', 'string', 'max:50'],
            'user_pasw_adm' => ['required', 'string', 'min:8'],
            'ann_aca' => ['required', 'integer'],
            'rol_usr' => ['required', 'string', 'max:50'],
            'para_cal' => ['required', 'numeric'],
            'coef_niv' => ['required', 'numeric'],
            'taux_hor' => ['required', 'numeric'],
        ]);

        if (DB::table('administrateur')->where('user_log_adm', $data['user_log_adm'])->exists()) {
            return response()->json([
                'message' => 'Cet administrateur existe deja.',
                'errors' => [
                    'user_log_adm' => ['Ce login est deja utilise.'],
                ],
            ], 409);
        }

        unset($data['type']);
        $data['user_pasw_adm'] = Hash::make($data['user_pasw_adm']);

        DB::table('administrateur')->insert($data);

        return response()->json([
            'message' => 'Administrateur inscrit avec succes.',
            'data' => [
                'user_log_adm' => $data['user_log_adm'],
                'ann_aca' => $data['ann_aca'],
                'rol_usr' => $data['rol_usr'],
            ],
        ], 201);
    }

    private function registerSecretaire(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['secretaire'])],
            'user_log_sp' => ['required', 'string', 'max:50'],
            'user_log_adm' => ['required', 'string', 'max:50', 'exists:administrateur,user_log_adm'],
            'user_pasw_sp' => ['required', 'string', 'min:8'],
            'nom_sp' => ['required', 'string', 'max:100'],
            'pren_sp' => ['required', 'string', 'max:100'],
            'email_sp' => ['required', 'email', 'max:150'],
            'rol_sp' => ['required', 'string', 'max:50'],
        ]);

        if (DB::table('secretaire_principal')->where('user_log_sp', $data['user_log_sp'])->exists()) {
            return response()->json([
                'message' => 'Ce secretaire existe deja.',
                'errors' => [
                    'user_log_sp' => ['Ce login est deja utilise.'],
                ],
            ], 409);
        }

        if (DB::table('secretaire_principal')->where('email_sp', $data['email_sp'])->exists()) {
            return response()->json([
                'message' => 'Ce secretaire existe deja.',
                'errors' => [
                    'email_sp' => ['Cet email est deja utilise.'],
                ],
            ], 409);
        }

        unset($data['type']);
        $data['user_pasw_sp'] = Hash::make($data['user_pasw_sp']);

        DB::table('secretaire_principal')->insert($data);

        return response()->json([
            'message' => 'Secretaire principal inscrit avec succes.',
            'data' => [
                'user_log_sp' => $data['user_log_sp'],
                'user_log_adm' => $data['user_log_adm'],
                'nom_sp' => $data['nom_sp'],
                'pren_sp' => $data['pren_sp'],
                'email_sp' => $data['email_sp'],
                'rol_sp' => $data['rol_sp'],
            ],
        ], 201);
    }

    private function registerEnseignant(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['enseignant'])],
            'user_log_adm' => ['required', 'string', 'max:50', 'exists:administrateur,user_log_adm'],
            'user_log_sp' => ['required', 'string', 'max:50', 'exists:secretaire_principal,user_log_sp'],
            'id_grade' => ['required', 'integer', 'exists:grades,id_grade'],            'id_statut' => ['required', 'integer', 'exists:statut,id_statut'],
            'id_depart' => ['required', 'integer', 'exists:departement,id_depart'],
            'user_log_ens' => ['required', 'string', 'max:50'],
            'user_pasw_ens' => ['required', 'string', 'min:8'],
            'nom_ens' => ['required', 'string', 'max:100'],
            'pren_ens' => ['required', 'string', 'max:100'],
            'email_ens' => ['required', 'email', 'max:150'],
            'tel_ens' => ['required', 'string', 'max:20'],
            'taux_hor_ens' => ['required', 'numeric'],
        ]);

        if (DB::table('enseignants')->where('user_log_ens', $data['user_log_ens'])->exists()) {
            return response()->json([
                'message' => 'Cet enseignant existe deja.',
                'errors' => [
                    'user_log_ens' => ['Ce login est deja utilise.'],
                ],
            ], 409);
        }

        if (DB::table('enseignants')->where('email_ens', $data['email_ens'])->exists()) {
            return response()->json([
                'message' => 'Cet enseignant existe deja.',
                'errors' => [
                    'email_ens' => ['Cet email est deja utilise.'],
                ],
            ], 409);
        }

        unset($data['type']);
        $data['user_pasw_ens'] = Hash::make($data['user_pasw_ens']);

        DB::table('enseignants')->insert($data);

        return response()->json([
            'message' => 'Enseignant inscrit avec succes.',
            'data' => [
                'user_log_ens' => $data['user_log_ens'],
                'user_log_adm' => $data['user_log_adm'],
                'user_log_sp' => $data['user_log_sp'],
                'nom_ens' => $data['nom_ens'],
                'pren_ens' => $data['pren_ens'],
                'email_ens' => $data['email_ens'],
                'tel_ens' => $data['tel_ens'],
            ],
        ], 201);
    }

    private function loginUser(
        Request $request,
        string $modelClass,
        string $loginField,
        string $passwordField,
        array $publicFields
    ): JsonResponse {
        $data = $request->validate([
            'type' => ['required', Rule::in(['administrateur', 'secretaire', 'enseignant'])],
            'login' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ]);

        $user = $modelClass::query()->where($loginField, $data['login'])->first();

        if (! $user || ! Hash::check($data['password'], $user->{$passwordField})) {
            Log::warning('Tentative de connexion échouée', [
                'login' => $data['login'],
                'type' => $data['type'],
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401);
        }

        if (isset($user->status) && $user->status === 'INACTIF') {
            return response()->json([
                'message' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
            ], 403);
        }

        DB::table($user->getTable())
            ->where($loginField, $data['login'])
            ->update(['last_login_at' => now()]);

        $userData = [];
        foreach ($publicFields as $field) {
            $userData[$field] = $user->{$field};
        }

        $user->tokens()->delete();
        $plainTextToken = $user->createToken(
            $data['type'].'-'.Str::slug($data['login']),
            [$data['type']]
        )->plainTextToken;

        Log::info('Connexion réussie', [
            'login' => $data['login'],
            'type' => $data['type'],
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Connexion reussie.',
            'type' => $data['type'],
            'token_type' => 'Bearer',
            'access_token' => $plainTextToken,
            'data' => $userData,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
            ], 401);
        }

        $data = $request->validate([
            'nom' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        $table = null;
        $whereField = null;
        $loginField = null;

        if (isset($user->user_log_adm)) {
            $table = 'administrateur';
            $whereField = 'user_log_adm';
            $loginField = $user->user_log_adm;
        } elseif (isset($user->user_log_sp)) {
            $table = 'secretaire_principal';
            $whereField = 'user_log_sp';
            $loginField = $user->user_log_sp;
        } elseif (isset($user->user_log_ens)) {
            $table = 'enseignants';
            $whereField = 'user_log_ens';
            $loginField = $user->user_log_ens;
        }

        if (! $table || ! $loginField) {
            return response()->json([
                'success' => false,
                'message' => 'Type d\'utilisateur invalide',
            ], 400);
        }

        $updates = [];

        // Mise à jour du nom
        if (isset($data['nom'])) {
            $parts = explode(' ', $data['nom'], 2);

            if ($table === 'administrateur') {
                $updates['pren_adm'] = $parts[0] ?? '';
                $updates['nom_adm'] = $parts[1] ?? $parts[0];
            } elseif ($table === 'enseignants') {
                $updates['pren_ens'] = $parts[0] ?? '';
                $updates['nom_ens'] = $parts[1] ?? $parts[0];
            } elseif ($table === 'secretaire_principal') {
                $updates['pren_sp'] = $parts[0] ?? '';
                $updates['nom_sp'] = $parts[1] ?? $parts[0];
            }
        }

        // Mise à jour de l'email
        if (isset($data['email'])) {
            $emailField = match ($table) {
                'administrateur' => 'email_adm',
                'enseignants' => 'email_ens',
                'secretaire_principal' => 'email_sp',
                default => null,
            };
            if ($emailField) {
                $updates[$emailField] = $data['email'];
            }
        }

        // Mise à jour du mot de passe
        if (isset($data['password']) && ! empty($data['password'])) {
            $passwordField = match ($table) {
                'administrateur' => 'user_pasw_adm',
                'enseignants' => 'user_pasw_ens',
                'secretaire_principal' => 'user_pasw_sp',
                default => null,
            };
            if ($passwordField) {
                $updates[$passwordField] = Hash::make($data['password']);
            }
        }

        if (! empty($updates)) {
            $affected = DB::table($table)
                ->where($whereField, $loginField)
                ->update($updates);

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune modification effectuée',
                ], 400);
            }
        }

        // Récupérer les nouvelles données
        $updatedUser = DB::table($table)
            ->where($whereField, $loginField)
            ->first();

        $userData = [];
        if ($table === 'administrateur') {
            $userData = [
                'nom' => trim(($updatedUser->pren_adm ?? '').' '.($updatedUser->nom_adm ?? '')),
                'email' => $updatedUser->email_adm ?? '',
                'login' => $updatedUser->user_log_adm ?? '',
            ];
        } elseif ($table === 'enseignants') {
            $userData = [
                'nom' => trim(($updatedUser->pren_ens ?? '').' '.($updatedUser->nom_ens ?? '')),
                'email' => $updatedUser->email_ens ?? '',
                'login' => $updatedUser->user_log_ens ?? '',
            ];
        } elseif ($table === 'secretaire_principal') {
            $userData = [
                'nom' => trim(($updatedUser->pren_sp ?? '').' '.($updatedUser->nom_sp ?? '')),
                'email' => $updatedUser->email_sp ?? '',
                'login' => $updatedUser->user_log_sp ?? '',
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data' => $userData,
        ]);
    }
}
