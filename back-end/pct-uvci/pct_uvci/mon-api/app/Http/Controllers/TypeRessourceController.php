<?php

namespace App\Http\Controllers;

use App\Models\TypeRessource;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TypeRessourceController extends Controller
{
    public function index(): JsonResponse
    {
        $types = DB::table('type_ressource as tr')
            ->leftJoin('niveaux_complexite as nc', 'tr.id_niv_complex', '=', 'nc.id_niv_complex')
            ->select(
                'tr.id_typ_res',
                'tr.typ_res',
                'tr.id_niv_complex',
                'nc.lib_niv_complex',
                'nc.coeff_niv_complex'
            )
            ->orderBy('tr.id_typ_res')
            ->get();

        return response()->json([
            'message' => 'Liste des types de ressources.',
            'data' => $types,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'typ_res' => ['required', 'string', 'max:100'],
            'id_niv_complex' => ['nullable', 'integer', 'exists:niveaux_complexite,id_niv_complex'],
        ]);

        if (TypeRessource::query()->where('typ_res', $data['typ_res'])->exists()) {
            return $this->alreadyExistsResponse();
        }

        $typeRessource = TypeRessource::query()->create($data);

        return response()->json([
            'message' => 'Type de ressource cree avec succes.',
            'data' => $typeRessource,
        ], 201);
    }

    public function show(int $idTypRes): JsonResponse
    {
        $typeRessource = TypeRessource::query()->find($idTypRes);

        if (! $typeRessource) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Type de ressource trouve.',
            'data' => $typeRessource,
        ]);
    }

    public function update(Request $request, int $idTypRes): JsonResponse
    {
        $typeRessource = TypeRessource::query()->find($idTypRes);

        if (! $typeRessource) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'typ_res' => [
                'required',
                'string',
                'max:100',
                Rule::unique('type_ressource', 'typ_res')->ignore($idTypRes, 'id_typ_res'),
            ],
            'id_niv_complex' => ['nullable', 'integer', 'exists:niveaux_complexite,id_niv_complex'],
        ]);

        $typeRessource->fill($data);
        $typeRessource->save();

        return response()->json([
            'message' => 'Type de ressource modifie avec succes.',
            'data' => $typeRessource,
        ]);
    }

    public function destroy(int $idTypRes): JsonResponse
    {
        $typeRessource = TypeRessource::query()->find($idTypRes);

        if (! $typeRessource) {
            return $this->notFoundResponse();
        }

        try {
            $typeRessource->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Ce type de ressource ne peut pas etre supprime car il est utilise par une ressource.',
            ], 409);
        }

        return response()->json([
            'message' => 'Type de ressource supprime avec succes.',
        ]);
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce type de ressource existe deja.',
            'errors' => [
                'typ_res' => ['Ce libelle est deja utilise.'],
            ],
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Type de ressource introuvable.',
        ], 404);
    }
}
