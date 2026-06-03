<?php

namespace App\Http\Controllers;

use App\Models\Parametre;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParametreController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des parametres.',
            'data' => Parametre::query()->orderBy('id_param')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateParametre($request);

        if ($this->parametreExists($data)) {
            return $this->alreadyExistsResponse();
        }

        $parametre = Parametre::query()->create($data);

        return response()->json([
            'message' => 'Parametre cree avec succes.',
            'data' => $parametre,
        ], 201);
    }

    public function show(int $idParam): JsonResponse
    {
        $parametre = Parametre::query()->find($idParam);

        if (! $parametre) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Parametre trouve.',
            'data' => $parametre,
        ]);
    }

    public function update(Request $request, int $idParam): JsonResponse
    {
        $parametre = Parametre::query()->find($idParam);

        if (! $parametre) {
            return $this->notFoundResponse();
        }

        $data = $this->validateParametre($request);

        if ($this->parametreExists($data, $idParam)) {
            return $this->alreadyExistsResponse();
        }

        $parametre->fill($data);
        $parametre->save();

        return response()->json([
            'message' => 'Parametre modifie avec succes.',
            'data' => $parametre,
        ]);
    }

    public function destroy(int $idParam): JsonResponse
    {
        $parametre = Parametre::query()->find($idParam);

        if (! $parametre) {
            return $this->notFoundResponse();
        }

        try {
            $parametre->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce parametre ne peut pas etre supprime car il est utilise par une activite pedagogique.',
            ], 409);
        }

        return response()->json([
            'message' => 'Parametre supprime avec succes.',
        ]);
    }

    private function validateParametre(Request $request): array
    {
        return $request->validate([
            'user_log_adm' => ['required', 'string', 'max:50', 'exists:administrateur,user_log_adm'],
            'annee_acad' => ['required', 'integer'],
            'taux_hor_defaut' => ['required', 'numeric', 'min:0'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after_or_equal:date_debut'],
        ]);
    }

    private function parametreExists(array $data, ?int $exceptId = null): bool
    {
        $query = Parametre::query()
            ->where('user_log_adm', $data['user_log_adm'])
            ->where('annee_acad', $data['annee_acad']);

        if ($exceptId !== null) {
            $query->where('id_param', '!=', $exceptId);
        }

        return $query->exists();
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Un parametre existe deja pour cet administrateur et cette annee academique.',
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Parametre introuvable.',
        ], 404);
    }
}
