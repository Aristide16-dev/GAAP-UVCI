<?php

namespace App\Http\Controllers;

use App\Models\ActivitePedagogique;
use App\Models\Enseignant;
use App\Services\VolumeHoraireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VolumeHoraireController extends Controller
{
    public function __construct(private readonly VolumeHoraireService $volumeHoraireService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();

        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->orderBy('id_ens')
            ->get()
            ->keyBy('id_ens');

        $data = $activites
            ->groupBy('id_ens')
            ->map(function ($activitesEnseignant, int $idEns) use ($enseignants): array {
                $enseignant = $enseignants->get($idEns);
                $totalHeures = $activitesEnseignant->sum(
                    fn (ActivitePedagogique $activite): float => $this->volumeHoraireService->resolvedActivityVolume($activite)
                );
                $tauxHoraire = $enseignant ? $enseignant->tauxEffectif() : 0;

                return [
                    'enseignant' => $enseignant,
                    'nombre_activites' => $activitesEnseignant->count(),
                    'volume_total_heures' => round($totalHeures, 2),
                    'taux_horaire' => round($tauxHoraire, 2),
                    'montant_estime' => round($totalHeures * $tauxHoraire, 2),
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Volumes horaires par enseignant.',
            'data' => $data,
        ]);
    }

    public function show(Request $request, int $idEns): JsonResponse
    {
        $enseignant = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->find($idEns);

        if (! $enseignant) {
            return response()->json([
                'message' => 'Enseignant introuvable.',
            ], 404);
        }

        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)
            ->where('id_ens', $idEns)
            ->get();

        $activitesData = $activites->map(function (ActivitePedagogique $activite): array {
            return [
                'id_activite'     => $activite->id_activite,
                'id_res'          => $activite->id_res,
                'id_cours'        => $activite->id_cours,
                'id_param'        => $activite->id_param,
                'id_niv_complex'  => $activite->id_niv_complex,
                'id_typ_activite' => $activite->id_typ_activite,
                'date_saisie'     => $activite->date_saisie,
                'vol_hor_cal'     => $this->volumeHoraireService->resolvedActivityVolume($activite),
                'statut'          => $activite->statut,
            ];
        });

        $totalHeures = $activitesData->sum('vol_hor_cal');
        $chargeNormale = $request->query('charge_normale');
        $heuresComplementaires = null;

        if ($chargeNormale !== null && is_numeric($chargeNormale)) {
            $heuresComplementaires = round(max($totalHeures - (float) $chargeNormale, 0), 2);
        }

        return response()->json([
            'message' => 'Recapitulatif horaire de l enseignant.',
            'data' => [
                'enseignant' => $enseignant,
                'nombre_activites' => $activitesData->count(),
                'volume_total_heures' => round($totalHeures, 2),
                'charge_normale' => $chargeNormale !== null ? round((float) $chargeNormale, 2) : null,
                'heures_complementaires' => $heuresComplementaires,
                'taux_horaire' => round($enseignant->tauxEffectif(), 2),
                'montant_estime' => round($totalHeures * $enseignant->tauxEffectif(), 2),
                'activites' => $activitesData,
            ],
        ]);
    }

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'id_param' => ['sometimes', 'required', 'integer', 'exists:parametre,id_param'],
            'date_debut' => ['sometimes', 'required', 'date'],
            'date_fin' => ['sometimes', 'required', 'date', 'after_or_equal:date_debut'],
            'charge_normale' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);
    }

    private function filteredActivities(array $filters)
    {
        return ActivitePedagogique::query()
            ->when(isset($filters['id_param']), fn ($query) => $query->where('id_param', $filters['id_param']))
            ->when(isset($filters['date_debut']), fn ($query) => $query->whereDate('date_saisie', '>=', $filters['date_debut']))
            ->when(isset($filters['date_fin']), fn ($query) => $query->whereDate('date_saisie', '<=', $filters['date_fin']))
            ->orderBy('id_ens')
            ->orderBy('date_saisie')
            ->orderBy('id_activite');
    }
}
