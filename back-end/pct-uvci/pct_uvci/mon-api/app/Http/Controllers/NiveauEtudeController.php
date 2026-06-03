<?php

namespace App\Http\Controllers;

use App\Models\NiveauEtude;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NiveauEtudeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des niveaux d etude.',
            'data' => NiveauEtude::query()->orderBy('id_niveau')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lib_niveau' => ['required', 'string', 'max:100'],
        ]);

        if (NiveauEtude::query()->where('lib_niveau', $data['lib_niveau'])->exists()) {
            return response()->json([
                'message' => 'Ce niveau d etude existe deja.',
                'errors' => [
                    'lib_niveau' => ['Ce libelle est deja utilise.'],
                ],
            ], 409);
        }

        $niveau = NiveauEtude::query()->create($data);

        return response()->json([
            'message' => 'Niveau d etude cree avec succes.',
            'data' => $niveau,
        ], 201);
    }

    public function show(int $idNiveau): JsonResponse
    {
        $niveau = NiveauEtude::query()->find($idNiveau);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Niveau d etude trouve.',
            'data' => $niveau,
        ]);
    }

    public function update(Request $request, int $idNiveau): JsonResponse
    {
        $niveau = NiveauEtude::query()->find($idNiveau);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'lib_niveau' => [
                'required',
                'string',
                'max:100',
                Rule::unique('niveau_etude', 'lib_niveau')->ignore($idNiveau, 'id_niveau'),
            ],
        ]);

        $niveau->fill($data);
        $niveau->save();

        return response()->json([
            'message' => 'Niveau d etude modifie avec succes.',
            'data' => $niveau,
        ]);
    }

    public function destroy(int $idNiveau): JsonResponse
    {
        $niveau = NiveauEtude::query()->find($idNiveau);

        if (! $niveau) {
            return $this->notFoundResponse();
        }

        try {
            $niveau->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce niveau ne peut pas etre supprime car il est utilise par un cours.',
            ], 409);
        }

        return response()->json([
            'message' => 'Niveau d etude supprime avec succes.',
        ]);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Niveau d etude introuvable.',
        ], 404);
    }
}
