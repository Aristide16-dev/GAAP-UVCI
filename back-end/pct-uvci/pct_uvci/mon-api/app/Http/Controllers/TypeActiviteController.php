<?php

namespace App\Http\Controllers;

use App\Models\TypeActivite;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TypeActiviteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des types d activites.',
            'data' => TypeActivite::query()->orderBy('id_typ_activite')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateTypeActivite($request);

        if (TypeActivite::query()->where('lib_activite', $data['lib_activite'])->exists()) {
            return $this->alreadyExistsResponse();
        }

        $typeActivite = TypeActivite::query()->create($data);

        return response()->json([
            'message' => 'Type d activite cree avec succes.',
            'data' => $typeActivite,
        ], 201);
    }

    public function show(int $idTypActivite): JsonResponse
    {
        $typeActivite = TypeActivite::query()->find($idTypActivite);

        if (! $typeActivite) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Type d activite trouve.',
            'data' => $typeActivite,
        ]);
    }

    public function update(Request $request, int $idTypActivite): JsonResponse
    {
        $typeActivite = TypeActivite::query()->find($idTypActivite);

        if (! $typeActivite) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'lib_activite' => [
                'required',
                'string',
                'max:100',
                Rule::unique('type_activite', 'lib_activite')->ignore($idTypActivite, 'id_typ_activite'),
            ],
            'multiplicateur_base' => ['required', 'numeric', 'min:0'],
        ]);

        $typeActivite->fill($data);
        $typeActivite->save();

        return response()->json([
            'message' => 'Type d activite modifie avec succes.',
            'data' => $typeActivite,
        ]);
    }

    public function destroy(int $idTypActivite): JsonResponse
    {
        $typeActivite = TypeActivite::query()->find($idTypActivite);

        if (! $typeActivite) {
            return $this->notFoundResponse();
        }

        try {
            $typeActivite->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce type d activite ne peut pas etre supprime car il est utilise par une activite pedagogique.',
            ], 409);
        }

        return response()->json([
            'message' => 'Type d activite supprime avec succes.',
        ]);
    }

    private function validateTypeActivite(Request $request): array
    {
        return $request->validate([
            'lib_activite' => ['required', 'string', 'max:100'],
            'multiplicateur_base' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce type d activite existe deja.',
            'errors' => [
                'lib_activite' => ['Ce libelle est deja utilise.'],
            ],
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Type d activite introuvable.',
        ], 404);
    }
}
