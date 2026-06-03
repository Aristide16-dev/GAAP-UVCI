<?php

namespace App\Http\Controllers;

use App\Models\Ressource;
use App\Models\SequenceCours;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RessourceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des ressources.',
            'data' => Ressource::query()->orderBy('id_res')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateRessource($request);

        if ($response = $this->validateSequenceCoursLink($data)) {
            return $response;
        }

        if ($this->ressourceExists($data)) {
            return $this->alreadyExistsResponse();
        }

        $ressource = Ressource::query()->create($data);

        return response()->json([
            'message' => 'Ressource creee avec succes.',
            'data' => $ressource,
        ], 201);
    }

    public function show(int $idRes): JsonResponse
    {
        $ressource = Ressource::query()->find($idRes);

        if (! $ressource) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Ressource trouvee.',
            'data' => $ressource,
        ]);
    }

    public function update(Request $request, int $idRes): JsonResponse
    {
        $ressource = Ressource::query()->find($idRes);

        if (! $ressource) {
            return $this->notFoundResponse();
        }

        $data = $this->validateRessource($request);

        if ($response = $this->validateSequenceCoursLink($data)) {
            return $response;
        }

        if ($this->ressourceExists($data, $idRes)) {
            return $this->alreadyExistsResponse();
        }

        $ressource->fill($data);
        $ressource->save();

        return response()->json([
            'message' => 'Ressource modifiee avec succes.',
            'data' => $ressource,
        ]);
    }

    public function destroy(int $idRes): JsonResponse
    {
        $ressource = Ressource::query()->find($idRes);

        if (! $ressource) {
            return $this->notFoundResponse();
        }

        try {
            $ressource->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cette ressource ne peut pas etre supprimee car elle est utilisee par une activite pedagogique.',
            ], 409);
        }

        return response()->json([
            'message' => 'Ressource supprimee avec succes.',
        ]);
    }

    private function validateRessource(Request $request): array
    {
        return $request->validate([
            'id_seq' => ['required', 'integer', 'exists:sequence_cours,id_seq'],
            'id_typ_res' => ['required', 'integer', 'exists:type_ressource,id_typ_res'],
            'id_cours' => ['required', 'integer', 'exists:cours,id_cours'],
            'titre_res' => ['required', 'string', 'max:150'],
        ]);
    }

    private function validateSequenceCoursLink(array $data): ?JsonResponse
    {
        $sequence = SequenceCours::query()->find($data['id_seq']);

        if ($sequence && $sequence->id_cours !== $data['id_cours']) {
            return response()->json([
                'message' => 'La sequence selectionnee n appartient pas au cours selectionne.',
                'errors' => [
                    'id_seq' => ['Cette sequence doit appartenir au cours indique.'],
                ],
            ], 422);
        }

        return null;
    }

    private function ressourceExists(array $data, ?int $exceptId = null): bool
    {
        $query = Ressource::query()
            ->where('id_seq', $data['id_seq'])
            ->where('id_typ_res', $data['id_typ_res'])
            ->where('id_cours', $data['id_cours'])
            ->where('titre_res', $data['titre_res']);

        if ($exceptId !== null) {
            $query->where('id_res', '!=', $exceptId);
        }

        return $query->exists();
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Cette ressource existe deja pour cette sequence.',
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Ressource introuvable.',
        ], 404);
    }
}
