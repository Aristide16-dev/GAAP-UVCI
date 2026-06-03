<?php

namespace App\Http\Controllers;

use App\Models\Departement;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des departements.',
            'data' => Departement::query()->orderBy('id_depart')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lib_depart' => ['required', 'string', 'max:150'],
        ]);

        if (Departement::query()->where('lib_depart', $data['lib_depart'])->exists()) {
            return $this->alreadyExistsResponse();
        }

        $departement = Departement::query()->create($data);

        return response()->json([
            'message' => 'Departement cree avec succes.',
            'data' => $departement,
        ], 201);
    }

    public function show(int $idDepart): JsonResponse
    {
        $departement = Departement::query()->find($idDepart);

        if (! $departement) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Departement trouve.',
            'data' => $departement,
        ]);
    }

    public function update(Request $request, int $idDepart): JsonResponse
    {
        $departement = Departement::query()->find($idDepart);

        if (! $departement) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'lib_depart' => [
                'required',
                'string',
                'max:150',
                Rule::unique('departement', 'lib_depart')->ignore($idDepart, 'id_depart'),
            ],
        ]);

        $departement->fill($data);
        $departement->save();

        return response()->json([
            'message' => 'Departement modifie avec succes.',
            'data' => $departement,
        ]);
    }

    public function destroy(int $idDepart): JsonResponse
    {
        $departement = Departement::query()->find($idDepart);

        if (! $departement) {
            return $this->notFoundResponse();
        }

        try {
            $departement->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce departement ne peut pas etre supprime car il est utilise par un enseignant.',
            ], 409);
        }

        return response()->json([
            'message' => 'Departement supprime avec succes.',
        ]);
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce departement existe deja.',
            'errors' => [
                'lib_depart' => ['Ce libelle est deja utilise.'],
            ],
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Departement introuvable.',
        ], 404);
    }
}
