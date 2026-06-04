<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des grades.',
            'data' => Grade::query()->orderBy('id_grade')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lib_grade' => ['required', 'string', 'max:100'],
            'taux_hor_permanent' => ['nullable', 'numeric', 'min:0'],
            'taux_hor_vacataire' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (Grade::query()->where('lib_grade', $data['lib_grade'])->exists()) {
            return $this->alreadyExistsResponse();
        }

        $grade = Grade::query()->create($data);

        return response()->json([
            'message' => 'Grade cree avec succes.',
            'data' => $grade,
        ], 201);
    }

    public function show(int $idGrade): JsonResponse
    {
        $grade = Grade::query()->find($idGrade);

        if (! $grade) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Grade trouve.',
            'data' => $grade,
        ]);
    }

    public function update(Request $request, int $idGrade): JsonResponse
    {
        $grade = Grade::query()->find($idGrade);

        if (! $grade) {
            return $this->notFoundResponse();
        }

        $oldData = [
            'taux_hor_permanent' => $grade->taux_hor_permanent,
            'taux_hor_vacataire' => $grade->taux_hor_vacataire,
            'quota_annuel' => $grade->quota_annuel,
        ];

        $data = $request->validate([
            'lib_grade' => ['nullable', 'string', 'max:100'],
            'taux_hor_permanent' => ['nullable', 'numeric', 'min:0'],
            'taux_hor_vacataire' => ['nullable', 'numeric', 'min:0'],
            'quota_annuel' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = auth()->user();
        $userName = 'Utilisateur';
        if ($user) {
            if (isset($user->nom_adm) && isset($user->pren_adm)) {
                $userName = trim($user->pren_adm.' '.$user->nom_adm);
            } elseif (isset($user->user_log_adm)) {
                $userName = $user->user_log_adm;
            } elseif (isset($user->nom)) {
                $userName = $user->nom;
            }
        }

        // Envelopper dans une transaction : si l'historique échoue, le barème est annulé aussi
        DB::transaction(function () use ($grade, $data, $oldData, $idGrade, $userName, $user) {
            $grade->update($data);

            DB::table('grade_history')->insert([
                'grade_id' => $idGrade,
                'user_id' => $user?->getKey() ?? null,
                'user_name' => $userName,
                'action' => 'Mise à jour du Barème',
                'old_data' => json_encode($oldData),
                'new_data' => json_encode([
                    'taux_hor_permanent' => $grade->taux_hor_permanent,
                    'taux_hor_vacataire' => $grade->taux_hor_vacataire,
                    'quota_annuel' => $grade->quota_annuel,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $grade->refresh();

        return response()->json([
            'message' => 'Grade modifie avec succes.',
            'data' => $grade,
        ]);
    }

    public function destroy(int $idGrade): JsonResponse
    {
        $grade = Grade::query()->find($idGrade);

        if (! $grade) {
            return $this->notFoundResponse();
        }

        try {
            $grade->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce grade ne peut pas etre supprime car il est utilise par un enseignant.',
            ], 409);
        }

        return response()->json([
            'message' => 'Grade supprime avec succes.',
        ]);
    }

    public function history(): JsonResponse
    {
        $history = DB::table('grade_history')
            ->select(
                'id',
                'user_name as user',
                'action',
                DB::raw("TO_CHAR(created_at, 'DD/MM/YYYY') as date"),
                DB::raw("TO_CHAR(created_at, 'HH24:MI') as time")
            )
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    public function deleteHistory(int $id): JsonResponse
    {
        $deleted = DB::table('grade_history')->where('id', $id)->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Entrée introuvable.'], 404);
        }

        return response()->json(['message' => 'Entrée supprimée avec succès.']);
    }

    public function clearHistory(): JsonResponse
    {
        DB::table('grade_history')->truncate();

        return response()->json(['message' => 'Historique vidé avec succès.']);
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce grade existe deja.',
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Grade introuvable.',
        ], 404);
    }
}
