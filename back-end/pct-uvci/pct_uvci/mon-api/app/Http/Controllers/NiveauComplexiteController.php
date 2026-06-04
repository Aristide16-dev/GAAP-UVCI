<?php

namespace App\Http\Controllers;

use App\Models\NiveauComplexite;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NiveauComplexiteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des niveaux de complexite.',
            'data' => NiveauComplexite::query()->orderBy('id_niv_complex')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lib_niv_complex' => ['required', 'string', 'max:100'],
            'coeff_niv_complex' => ['required', 'numeric', 'min:0'],
        ]);

        $niveau = NiveauComplexite::query()->create($data);

        return response()->json([
            'message' => 'Niveau de complexite cree avec succes.',
            'data' => $niveau,
        ], 201);
    }

    public function show(int $idNivComplex): JsonResponse
    {
        $niveau = NiveauComplexite::query()->find($idNivComplex);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Niveau de complexite trouve.',
            'data' => $niveau,
        ]);
    }

    public function update(Request $request, int $idNivComplex): JsonResponse
    {
        $niveau = NiveauComplexite::query()->find($idNivComplex);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        $oldData = [
            'coeff_niv_complex' => $niveau->coeff_niv_complex,
        ];

        $data = $request->validate([
            'lib_niv_complex' => ['nullable', 'string', 'max:100'],
            'coeff_niv_complex' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = auth()->user();
        $userName = 'Inconnu';
        if ($user) {
            if (isset($user->nom_adm)) {
                $userName = trim(($user->pren_adm ?? '').' '.($user->nom_adm ?? ''));
            } elseif (isset($user->nom_sp)) {
                $userName = trim(($user->pren_sp ?? '').' '.($user->nom_sp ?? ''));
            } elseif (isset($user->nom_ens)) {
                $userName = trim(($user->pren_ens ?? '').' '.($user->nom_ens ?? ''));
            } elseif (isset($user->nom)) {
                $userName = $user->nom;
            }
            if (empty($userName)) {
                $userName = $user->user_log_adm ?? $user->user_log_sp ?? $user->user_log_ens ?? 'Inconnu';
            }
        }

        // Envelopper dans une transaction : si l'historique échoue, la mise à jour est annulée
        DB::transaction(function () use ($niveau, $data, $oldData, $idNivComplex, $userName, $user) {
            $niveau->update($data);

            DB::table('complexity_history')->insert([
                'niveau_complexite_id' => $idNivComplex,
                'user_id' => $user?->getKey() ?? null,
                'user_name' => $userName,
                'action' => 'Mise à jour des coefficients',
                'old_data' => json_encode($oldData),
                'new_data' => json_encode(['coeff_niv_complex' => $niveau->coeff_niv_complex]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $niveau->refresh();

        return response()->json([
            'message' => 'Niveau de complexite modifie avec succes.',
            'data' => $niveau,
        ]);
    }

    public function destroy(int $idNivComplex): JsonResponse
    {
        $niveau = NiveauComplexite::query()->find($idNivComplex);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        try {
            $niveau->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce niveau de complexite ne peut pas etre supprime car il est utilise par une activite pedagogique.',
            ], 409);
        }

        return response()->json([
            'message' => 'Niveau de complexite supprime avec succes.',
        ]);
    }

    public function history(): JsonResponse
    {
        $history = DB::table('complexity_history')
            ->select(
                'id',
                'user_name as user',
                'action as title',
                DB::raw("TO_CHAR(created_at, 'DD/MM/YYYY à HH24:MI') as date"),
                DB::raw("'user' as type")
            )
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Niveau de complexite introuvable.',
        ], 404);
    }

    public function deleteNiveauxComplexiteHistory($id): JsonResponse
    {
        $deleted = DB::table('complexity_history')
            ->where('id', $id)
            ->delete();

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Entrée d\'historique supprimée avec succès',
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Entrée d\'historique non trouvée',
        ], 404);
    }

    public function clearNiveauxComplexiteHistory(): JsonResponse
    {
        DB::table('complexity_history')->truncate();

        return response()->json([
            'success' => true,
            'message' => 'Historique vidé avec succès',
        ], 200);
    }
}
