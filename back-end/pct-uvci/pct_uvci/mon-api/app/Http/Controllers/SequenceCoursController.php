<?php

namespace App\Http\Controllers;

use App\Models\SequenceCours;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SequenceCoursController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des sequences de cours.',
            'data' => SequenceCours::query()->orderBy('id_seq')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateSequence($request);

        if ($this->sequenceExists($data)) {
            return $this->alreadyExistsResponse();
        }

        $sequence = SequenceCours::query()->create($data);

        return response()->json([
            'message' => 'Sequence de cours creee avec succes.',
            'data' => $sequence,
        ], 201);
    }

    public function show(int $idSeq): JsonResponse
    {
        $sequence = SequenceCours::query()->find($idSeq);

        if (! $sequence) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Sequence de cours trouvee.',
            'data' => $sequence,
        ]);
    }

    public function update(Request $request, int $idSeq): JsonResponse
    {
        $sequence = SequenceCours::query()->find($idSeq);

        if (! $sequence) {
            return $this->notFoundResponse();
        }

        $data = $this->validateSequence($request);

        if ($this->sequenceExists($data, $idSeq)) {
            return $this->alreadyExistsResponse();
        }

        $sequence->fill($data);
        $sequence->save();

        return response()->json([
            'message' => 'Sequence de cours modifiee avec succes.',
            'data' => $sequence,
        ]);
    }

    public function destroy(int $idSeq): JsonResponse
    {
        $sequence = SequenceCours::query()->find($idSeq);

        if (! $sequence) {
            return $this->notFoundResponse();
        }

        try {
            $sequence->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cette sequence ne peut pas etre supprimee car elle est utilisee par une ressource.',
            ], 409);
        }

        return response()->json([
            'message' => 'Sequence de cours supprimee avec succes.',
        ]);
    }

    private function validateSequence(Request $request): array
    {
        return $request->validate([
            'id_cours' => ['required', 'integer', 'exists:cours,id_cours'],
            'titre_seq' => ['required', 'string', 'max:150'],
        ]);
    }

    private function sequenceExists(array $data, ?int $exceptId = null): bool
    {
        $query = SequenceCours::query()
            ->where('id_cours', $data['id_cours'])
            ->where('titre_seq', $data['titre_seq']);

        if ($exceptId !== null) {
            $query->where('id_seq', '!=', $exceptId);
        }

        return $query->exists();
    }

    private function alreadyExistsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Cette sequence existe deja pour ce cours.',
        ], 409);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Sequence de cours introuvable.',
        ], 404);
    }
}
