<?php

namespace App\Http\Controllers;

use App\Models\ActivitePedagogique;
use App\Models\Departement;
use App\Models\Enseignant;
use App\Models\TypeActivite;
use App\Services\VolumeHoraireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EtatController extends Controller
{
    public function __construct(private readonly VolumeHoraireService $volumeHoraireService) {}

    public function ficheEnseignant(Request $request, int $idEns): JsonResponse
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

        $lignes = $this->activityLines($activites);
        $volumeTotal = $lignes->sum('volume_horaire');
        $chargeNormale = $filters['charge_normale'] ?? null;

        return response()->json([
            'message' => 'Fiche individuelle enseignant.',
            'data' => [
                'enseignant' => $enseignant,
                'periode' => $this->periode($filters),
                'nombre_activites' => $lignes->count(),
                'volume_total_heures' => round($volumeTotal, 2),
                'charge_normale' => $chargeNormale !== null ? round((float) $chargeNormale, 2) : null,
                'heures_complementaires' => $chargeNormale !== null ? round(max($volumeTotal - (float) $chargeNormale, 0), 2) : null,
                'taux_horaire' => round($enseignant->tauxEffectif(), 2),
                'montant_estime' => round($volumeTotal * $enseignant->tauxEffectif(), 2),
                'activites' => $lignes,
            ],
        ]);
    }

    public function etatGlobalHeures(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();
        $enseignants = $this->enseignantsFor($activites);
        $lignes = $this->summaryByTeacher($activites, $enseignants, $filters);

        return response()->json([
            'message' => 'Etat global des heures.',
            'data' => [
                'periode' => $this->periode($filters),
                'nombre_enseignants' => $lignes->count(),
                'nombre_activites' => $activites->count(),
                'volume_total_heures' => round($lignes->sum('volume_total_heures'), 2),
                'lignes' => $lignes,
            ],
        ]);
    }

    public function etatPaiements(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();
        $enseignants = $this->enseignantsFor($activites);
        $lignes = $this->summaryByTeacher($activites, $enseignants, $filters)
            ->map(function (array $ligne): array {
                return [
                    'enseignant' => $ligne['enseignant'],
                    'volume_total_heures' => $ligne['volume_total_heures'],
                    'heures_complementaires' => $ligne['heures_complementaires'],
                    'taux_horaire' => $ligne['taux_horaire'],
                    'montant_estime' => $ligne['montant_estime'],
                ];
            });

        return response()->json([
            'message' => 'Etat des paiements.',
            'data' => [
                'periode' => $this->periode($filters),
                'nombre_enseignants' => $lignes->count(),
                'volume_total_heures' => round($lignes->sum('volume_total_heures'), 2),
                'montant_total_estime' => round($lignes->sum('montant_estime'), 2),
                'lignes' => $lignes,
            ],
        ]);
    }

    public function statistiquesPedagogiques(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();
        $enseignants = $this->enseignantsFor($activites);
        $typesActivites = TypeActivite::query()
            ->whereIn('id_typ_activite', $activites->pluck('id_typ_activite')->unique()->values())
            ->get()
            ->keyBy('id_typ_activite');
        $departements = Departement::query()
            ->whereIn('id_depart', $enseignants->pluck('id_depart')->unique()->values())
            ->get()
            ->keyBy('id_depart');
        $items = $this->activitiesWithVolume($activites);

        return response()->json([
            'message' => 'Statistiques pedagogiques.',
            'data' => [
                'periode' => $this->periode($filters),
                'par_type_activite' => $this->statsByActivityType($items, $typesActivites),
                'par_departement' => $this->statsByDepartment($items, $enseignants, $departements),
                'par_mois' => $this->statsByMonth($items),
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

    private function periode(array $filters): array
    {
        return [
            'id_param' => $filters['id_param'] ?? null,
            'date_debut' => $filters['date_debut'] ?? null,
            'date_fin' => $filters['date_fin'] ?? null,
        ];
    }

    private function enseignantsFor($activites)
    {
        return Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->get()
            ->keyBy('id_ens');
    }

    private function activitiesWithVolume($activites)
    {
        return $activites->map(fn (ActivitePedagogique $activite): array => [
            'activite' => $activite,
            'volume_horaire' => $this->volumeHoraireService->resolvedActivityVolume($activite),
        ]);
    }

    private function activityLines($activites)
    {
        return $this->activitiesWithVolume($activites)
            ->map(fn (array $item): array => [
                'id_activite' => $item['activite']->id_activite,
                'id_res' => $item['activite']->id_res,
                'id_cours' => $item['activite']->id_cours,
                'id_param' => $item['activite']->id_param,
                'id_niv_complex' => $item['activite']->id_niv_complex,
                'id_typ_activite' => $item['activite']->id_typ_activite,
                'date_saisie' => $item['activite']->date_saisie,
                'volume_horaire' => $item['volume_horaire'],
            ])
            ->values();
    }

    private function summaryByTeacher($activites, $enseignants, array $filters)
    {
        $chargeNormale = $filters['charge_normale'] ?? null;

        return $this->activitiesWithVolume($activites)
            ->groupBy(fn (array $item): int => $item['activite']->id_ens)
            ->map(function ($items, int $idEns) use ($enseignants, $chargeNormale): array {
                $enseignant = $enseignants->get($idEns);
                $volume = $items->sum('volume_horaire');
                $tauxHoraire = $enseignant ? $enseignant->tauxEffectif() : 0;

                return [
                    'enseignant' => $enseignant,
                    'nombre_activites' => $items->count(),
                    'volume_total_heures' => round($volume, 2),
                    'charge_normale' => $chargeNormale !== null ? round((float) $chargeNormale, 2) : null,
                    'heures_complementaires' => $chargeNormale !== null ? round(max($volume - (float) $chargeNormale, 0), 2) : null,
                    'taux_horaire' => round($tauxHoraire, 2),
                    'montant_estime' => round($volume * $tauxHoraire, 2),
                ];
            })
            ->sortBy(fn (array $ligne): string => ($ligne['enseignant']->nom_ens ?? '').' '.($ligne['enseignant']->pren_ens ?? ''))
            ->values();
    }

    private function statsByActivityType($items, $typesActivites)
    {
        return $items
            ->groupBy(fn (array $item): int => $item['activite']->id_typ_activite)
            ->map(fn ($group, int $idType): array => [
                'type_activite' => $typesActivites->get($idType),
                'nombre_activites' => $group->count(),
                'volume_total_heures' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortByDesc('nombre_activites')
            ->values();
    }

    private function statsByDepartment($items, $enseignants, $departements)
    {
        return $items
            ->groupBy(function (array $item) use ($enseignants): int {
                $enseignant = $enseignants->get($item['activite']->id_ens);

                return $enseignant ? (int) $enseignant->id_depart : 0;
            })
            ->map(fn ($group, int $idDepart): array => [
                'departement' => $departements->get($idDepart),
                'nombre_activites' => $group->count(),
                'volume_total_heures' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortByDesc('volume_total_heures')
            ->values();
    }

    private function statsByMonth($items)
    {
        return $items
            ->groupBy(fn (array $item): string => $item['activite']->date_saisie->format('Y-m'))
            ->map(fn ($group, string $mois): array => [
                'mois' => $mois,
                'nombre_activites' => $group->count(),
                'volume_total_heures' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortBy('mois')
            ->values();
    }
}
