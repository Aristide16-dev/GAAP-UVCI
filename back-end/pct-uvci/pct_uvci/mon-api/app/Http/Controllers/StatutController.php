<?php

namespace App\Http\Controllers;

use App\Models\Statut;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StatutController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des statuts.',
            'data' => Statut::query()->orderBy('id_statut')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lib_statut' => ['required', 'string', 'max:100'],
        ]);

        if (Statut::query()->where('lib_statut', $data['lib_statut'])->exists()) {
            return $this->alreadyExistsResponse();
        }

        $statut = Statut::query()->create($data);

        return response()->json([
            'message' => 'Statut cree avec succes.',
            'data' => $statut,
        ], 201);
    }

    public function show(int $idStatut): JsonResponse
    {
        $statut = Statut::query()->find($idStatut);

        if (! $statut) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Statut trouve.',
            'data' => $statut,
        ]);
    }

    public function update(Request $request, int $idStatut): JsonResponse
    {
        $statut = Statut::query()->find($idStatut);

        if (! $statut) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'lib_statut' => [
                'required',
                'string',
                'max:100',
                Rule::unique('statut', 'lib_statut')->ignore($idStatut, 'id_statut'),
            ],
        ]);

        $statut->fill($data);
        $statut->save();

        return response()->json([
            'message' => 'Statut modifie avec succes.',
            'data' => $statut,
        ]);
    }

    public function destroy(int $idStatut): JsonResponse
    {
        $statut = Statut::query()->find($idStatut);

        if (! $statut) {
            return $this->notFoundResponse();
        }

        try {
            $statut->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce statut ne peut pas etre supprime car il est utilise par un enseignant.',
            ], 409);
        }

        return response()->json([
            'message' => 'Statut supprime avec succes.',
        ]);
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce statut existe deja.',
            'errors' => [
                'lib_statut' => ['Ce libelle est deja utilise.'],
            ],
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Statut introuvable.',
        ], 404);
    }
}
