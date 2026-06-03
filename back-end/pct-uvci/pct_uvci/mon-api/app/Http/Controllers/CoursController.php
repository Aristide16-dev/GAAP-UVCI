<?php

namespace App\Http\Controllers;

use App\Models\Cours;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoursController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des cours.',
            'data' => Cours::query()->orderBy('id_cours')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateCours($request);

        if ($this->coursExists($data)) {
            return $this->alreadyExistsResponse();
        }

        $cours = Cours::query()->create($data);

        return response()->json([
            'message' => 'Cours cree avec succes.',
            'data' => $cours,
        ], 201);
    }

    public function show(int $idCours): JsonResponse
    {
        $cours = Cours::query()->find($idCours);

        if (! $cours) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Cours trouve.',
            'data' => $cours,
        ]);
    }

    public function update(Request $request, int $idCours): JsonResponse
    {
        $cours = Cours::query()->find($idCours);

        if (! $cours) {
            return $this->notFoundResponse();
        }

        $data = $this->validateCours($request);

        if ($this->coursExists($data, $idCours)) {
            return $this->alreadyExistsResponse();
        }

        $cours->fill($data);
        $cours->save();

        return response()->json([
            'message' => 'Cours modifie avec succes.',
            'data' => $cours,
        ]);
    }

    public function destroy(int $idCours): JsonResponse
    {
        $cours = Cours::query()->find($idCours);

        if (! $cours) {
            return $this->notFoundResponse();
        }

        try {
            $cours->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce cours ne peut pas etre supprime car il est utilise par une ressource.',
            ], 409);
        }

        return response()->json([
            'message' => 'Cours supprime avec succes.',
        ]);
    }

    private function validateCours(Request $request): array
    {
        return $request->validate([
            'id_niveau' => ['required', 'integer', 'exists:niveau_etude,id_niveau'],
            'int_cours' => ['required', 'string', 'max:150'],
            'filiere' => ['required', 'string', 'max:100'],
            'semestre' => ['required', 'string', 'max:50'],
            'nb_heures' => ['required', 'integer', 'min:1'],
            'nb_credits' => ['required', 'integer', 'min:1'],
            'id_typ_res' => ['nullable', 'integer', 'exists:type_ressource,id_typ_res'],
        ]);
    }

    private function coursExists(array $data, ?int $exceptId = null): bool
    {
        $query = Cours::query()
            ->where('id_niveau', $data['id_niveau'])
            ->where('int_cours', $data['int_cours'])
            ->where('filiere', $data['filiere'])
            ->where('semestre', $data['semestre']);

        if ($exceptId !== null) {
            $query->where('id_cours', '!=', $exceptId);
        }

        return $query->exists();
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce cours existe deja pour ce niveau, cette filiere et ce semestre.',
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Cours introuvable.',
        ], 404);
    }
}
