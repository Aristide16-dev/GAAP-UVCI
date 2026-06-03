<?php

namespace App\Http\Controllers;

use App\Models\ActivitePedagogique;
use App\Services\VolumeHoraireService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivitePedagogiqueController extends Controller
{
    public function __construct(private readonly VolumeHoraireService $volumeHoraireService) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Liste des activites pedagogiques.',
            'data' => ActivitePedagogique::query()->orderBy('id_activite', 'desc')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateStore($request);

        $data['user_log_sp'] = Auth::user()->user_log_sp ?? null;
        $data['vol_hor_cal'] = $this->volumeHoraireService->calculateFromData($data);

        $activite = ActivitePedagogique::query()->create($data)->refresh();

        return response()->json([
            'message' => 'Activite pedagogique creee avec succes.',
            'data' => $activite,
        ], 201);
    }

    public function show(int $idActivite): JsonResponse
    {
        $activite = ActivitePedagogique::query()->find($idActivite);

        if (! $activite) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Activite pedagogique trouvee.',
            'data' => $activite,
        ]);
    }

    public function update(Request $request, int $idActivite): JsonResponse
    {
        $activite = ActivitePedagogique::query()->find($idActivite);

        if (! $activite) {
            return $this->notFoundResponse();
        }

        $data = $this->validateUpdate($request);

        if (isset($data['id_cours']) || isset($data['id_niv_complex']) || isset($data['id_typ_activite'])) {
            $calcData = [
                'id_cours'        => $data['id_cours'] ?? $activite->id_cours,
                'id_niv_complex'  => $data['id_niv_complex'] ?? $activite->id_niv_complex,
                'id_typ_activite' => $data['id_typ_activite'] ?? $activite->id_typ_activite,
            ];
            $data['vol_hor_cal'] = $this->volumeHoraireService->calculateFromData($calcData);
        }

        $activite->fill($data);
        $activite->save();
        $activite->refresh();

        return response()->json([
            'message' => 'Activite pedagogique modifiee avec succes.',
            'data' => $activite,
        ]);
    }

    public function destroy(int $idActivite): JsonResponse
    {
        $activite = ActivitePedagogique::query()->find($idActivite);

        if (! $activite) {
            return $this->notFoundResponse();
        }

        try {
            $activite->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cette activite pedagogique ne peut pas etre supprimee.',
            ], 409);
        }

        return response()->json([
            'message' => 'Activite pedagogique supprimee avec succes.',
        ]);
    }

    private function validateStore(Request $request): array
    {
        return $request->validate([
            'id_ens'          => ['required', 'integer', 'exists:enseignants,id_ens'],
            'id_cours'        => ['required', 'integer', 'exists:cours,id_cours'],
            'id_param'        => ['required', 'integer', 'exists:parametre,id_param'],
            'id_niv_complex'  => ['required', 'integer', 'exists:niveaux_complexite,id_niv_complex'],
            'id_typ_activite' => ['required', 'integer', 'exists:type_activite,id_typ_activite'],
            'id_res'          => ['nullable', 'integer', 'exists:ressource,id_res'],
            'date_saisie'     => ['sometimes', 'required', 'date'],
        ]);
    }

    private function validateUpdate(Request $request): array
    {
        return $request->validate([
            'id_ens'          => ['sometimes', 'integer', 'exists:enseignants,id_ens'],
            'id_cours'        => ['sometimes', 'integer', 'exists:cours,id_cours'],
            'id_param'        => ['sometimes', 'integer', 'exists:parametre,id_param'],
            'id_niv_complex'  => ['sometimes', 'integer', 'exists:niveaux_complexite,id_niv_complex'],
            'id_typ_activite' => ['sometimes', 'integer', 'exists:type_activite,id_typ_activite'],
            'id_res'          => ['nullable', 'integer', 'exists:ressource,id_res'],
            'date_saisie'     => ['sometimes', 'date'],
            'statut'          => ['sometimes', 'string', 'in:en_attente,approuve,rejete'],
            'vol_hor_cal'     => ['sometimes', 'numeric'],
        ]);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Activite pedagogique introuvable.',
        ], 404);
    }
}