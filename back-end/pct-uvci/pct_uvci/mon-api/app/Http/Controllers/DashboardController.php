<?php

/**
 * DashboardController.php — Données du tableau de bord
 *
 * Ce contrôleur fournit les statistiques affichées sur les tableaux de bord
 * de l'administrateur et de la secrétaire.
 *
 * Il calcule en temps réel :
 * - Le volume horaire global de l'année académique en cours
 * - Le nombre d'enseignants actifs
 * - Le nombre d'enseignants ayant dépassé leur quota
 * - La production mensuelle ou annuelle (pour les graphiques)
 * - La répartition des heures par département
 * - La liste des enseignants en dépassement avec leurs détails
 *
 * OPTIMISATION PERFORMANCE :
 * La méthode index() utilise ->with(['cours', 'niveauComplexite', 'typeActivite'])
 * pour l'eager loading Eloquent → évite le problème N+1 (une requête par activité).
 * Sans cela, 100 activités = 300 requêtes SQL inutiles.
 *
 * La méthode secretaireDashboard() utilise des requêtes SQL directes (DB::table)
 * avec des agrégats (SUM, COUNT, GROUP BY) pour des performances optimales.
 *
 * INJECTION DE DÉPENDANCE :
 * VolumeHoraireService est injecté dans le constructeur par Laravel.
 * C'est le service qui contient la formule de calcul du volume horaire.
 */

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use App\Models\ActivitePedagogique;
use App\Models\Departement;
use App\Models\Enseignant;
use App\Models\TypeActivite;
use App\Services\VolumeHoraireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Le VolumeHoraireService est injecté automatiquement par le conteneur Laravel.
     * Il contient la logique de calcul du volume horaire des activités.
     */
    public function __construct(private readonly VolumeHoraireService $volumeHoraireService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();

        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->get()
            ->keyBy('id_ens');

        $departements = Departement::query()
            ->whereIn('id_depart', $enseignants->pluck('id_depart')->unique()->values())
            ->get()
            ->keyBy('id_depart');

        $typesActivites = TypeActivite::query()
            ->whereIn('id_typ_activite', $activites->pluck('id_typ_activite')->unique()->values())
            ->get()
            ->keyBy('id_typ_activite');

        $activitesAvecVolume = $activites->map(function (ActivitePedagogique $activite): array {
            return [
                'activite' => $activite,
                'volume_horaire' => $this->volumeHoraireService->resolvedActivityVolume($activite),
            ];
        });

        $volumeTotal = $activitesAvecVolume->sum('volume_horaire');

        return response()->json([
            'message' => 'Tableau de bord des activites pedagogiques.',
            'data' => [
                'indicateurs' => [
                    'nombre_enseignants' => $enseignants->count(),
                    'nombre_activites' => $activites->count(),
                    'volume_total_heures' => round($volumeTotal, 2),
                    'montant_total_estime' => $this->montantTotalEstime($activitesAvecVolume, $enseignants),
                ],
                'volume_par_enseignant' => $this->volumeParEnseignant($activitesAvecVolume, $enseignants),
                'repartition_activites' => $this->repartitionActivites($activitesAvecVolume, $typesActivites),
                'volume_par_departement' => $this->volumeParDepartement($activitesAvecVolume, $enseignants, $departements),
                'enseignants_ayant_depasse_charge' => $this->enseignantsAyantDepasseCharge($activitesAvecVolume, $enseignants, $filters),
                'statistiques_mensuelles' => $this->statistiquesMensuelles($activitesAvecVolume),
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
            ->orderBy('date_saisie')
            ->orderBy('id_activite');
    }

    private function montantTotalEstime($activitesAvecVolume, $enseignants): float
    {
        $montant = $activitesAvecVolume->sum(function (array $item) use ($enseignants): float {
            $enseignant = $enseignants->get($item['activite']->id_ens);

            return $item['volume_horaire'] * ($enseignant ? $enseignant->tauxEffectif() : 0);
        });

        return round($montant, 2);
    }

    private function volumeParEnseignant($activitesAvecVolume, $enseignants)
    {
        return $activitesAvecVolume
            ->groupBy(fn (array $item): int => $item['activite']->id_ens)
            ->map(function ($items, int $idEns) use ($enseignants): array {
                $enseignant = $enseignants->get($idEns);
                $volume = $items->sum('volume_horaire');
                $tauxHoraire = $enseignant ? $enseignant->tauxEffectif() : 0;

                return [
                    'enseignant' => $enseignant,
                    'nombre_activites' => $items->count(),
                    'volume_total_heures' => round($volume, 2),
                    'montant_estime' => round($volume * $tauxHoraire, 2),
                ];
            })
            ->sortByDesc('volume_total_heures')
            ->values();
    }

    private function repartitionActivites($activitesAvecVolume, $typesActivites)
    {
        return $activitesAvecVolume
            ->groupBy(fn (array $item): int => $item['activite']->id_typ_activite)
            ->map(function ($items, int $idTypeActivite) use ($typesActivites): array {
                return [
                    'type_activite' => $typesActivites->get($idTypeActivite),
                    'nombre_activites' => $items->count(),
                    'volume_total_heures' => round($items->sum('volume_horaire'), 2),
                ];
            })
            ->sortByDesc('nombre_activites')
            ->values();
    }

    private function volumeParDepartement($activitesAvecVolume, $enseignants, $departements)
    {
        return $activitesAvecVolume
            ->groupBy(function (array $item) use ($enseignants): int {
                $enseignant = $enseignants->get($item['activite']->id_ens);

                return $enseignant ? (int) $enseignant->id_depart : 0;
            })
            ->map(function ($items, int $idDepart) use ($departements): array {
                return [
                    'departement' => $departements->get($idDepart),
                    'nombre_activites' => $items->count(),
                    'volume_total_heures' => round($items->sum('volume_horaire'), 2),
                ];
            })
            ->sortByDesc('volume_total_heures')
            ->values();
    }

    private function enseignantsAyantDepasseCharge($activitesAvecVolume, $enseignants, array $filters)
    {
        if (! isset($filters['charge_normale'])) {
            return [];
        }

        $chargeNormale = (float) $filters['charge_normale'];

        return $activitesAvecVolume
            ->groupBy(fn (array $item): int => $item['activite']->id_ens)
            ->map(function ($items, int $idEns) use ($enseignants, $chargeNormale): array {
                $volume = $items->sum('volume_horaire');

                return [
                    'enseignant' => $enseignants->get($idEns),
                    'volume_total_heures' => round($volume, 2),
                    'charge_normale' => round($chargeNormale, 2),
                    'heures_complementaires' => round(max($volume - $chargeNormale, 0), 2),
                ];
            })
            ->filter(fn (array $item): bool => $item['heures_complementaires'] > 0)
            ->sortByDesc('heures_complementaires')
            ->values();
    }

    private function statistiquesMensuelles($activitesAvecVolume)
    {
        return $activitesAvecVolume
            ->groupBy(function (array $item): string {
                return $item['activite']->date_saisie->format('Y-m');
            })
            ->map(function ($items, string $mois): array {
                return [
                    'mois' => $mois,
                    'nombre_activites' => $items->count(),
                    'volume_total_heures' => round($items->sum('volume_horaire'), 2),
                ];
            })
            ->sortBy('mois')
            ->values();
    }

    public function secretaireDashboard(Request $request): JsonResponse
    {
        $anneeAcademique = DB::table('academic_years')
            ->where('is_active', true)
            ->first();

        if (!$anneeAcademique) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune année académique active',
                'data' => [
                    'volumeHoraireGlobal' => 0,
                    'enseignantsActifs' => 0,
                    'depassementsCritiques' => 0,
                    'productionMensuelle' => [],
                    'heuresParDepartement' => [],
                    'enseignantsDepassement' => [],
                ],
            ]);
        }

        $anneeInt = (int) substr($anneeAcademique->year_label, 0, 4);

        $volumeHoraireGlobal = DB::table('activite_pedagogique as ap')
            ->join('parametre as p', 'ap.id_param', '=', 'p.id_param')
            ->where('p.annee_acad', $anneeInt)
            ->sum('ap.vol_hor_cal') ?? 0;

        $enseignantsActifs = DB::table('enseignants')
            ->where('status', 'ACTIF')
            ->count();

        $depassementsCritiques = DB::table('enseignants as e')
            ->join('grades as g', 'e.id_grade', '=', 'g.id_grade')
            ->leftJoin('activite_pedagogique as ap', 'e.id_ens', '=', 'ap.id_ens')
            ->leftJoin('parametre as p', 'ap.id_param', '=', 'p.id_param')
            ->select('e.id_ens')
            ->where('e.status', 'ACTIF')
            ->where('p.annee_acad', $anneeInt)
            ->groupBy('e.id_ens', 'g.quota_annuel')
            ->havingRaw('COALESCE(SUM(ap.vol_hor_cal), 0) > g.quota_annuel')
            ->count();

        $period = $request->input('period', 'monthly');

        if ($period === 'annual') {
            $productionMensuelle = DB::table('activite_pedagogique as ap')
                ->join('parametre as p', 'ap.id_param', '=', 'p.id_param')
                ->select(
                    DB::raw("TO_CHAR(ap.date_saisie, 'YYYY') as mois"),
                    DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) as total')
                )
                ->where('p.annee_acad', $anneeInt)
                ->where('ap.date_saisie', '>=', now()->subYears(5))
                ->groupBy(DB::raw("TO_CHAR(ap.date_saisie, 'YYYY')"))
                ->orderByRaw("MIN(ap.date_saisie)")
                ->get();
        } else {
            $productionMensuelle = DB::table('activite_pedagogique as ap')
                ->join('parametre as p', 'ap.id_param', '=', 'p.id_param')
                ->select(
                    DB::raw("TO_CHAR(ap.date_saisie, 'YYYY-MM') as mois"),
                    DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) as total')
                )
                ->where('p.annee_acad', $anneeInt)
                ->where('ap.date_saisie', '>=', now()->subMonths(6))
                ->groupBy(DB::raw("TO_CHAR(ap.date_saisie, 'YYYY-MM')"))
                ->orderByRaw("MIN(ap.date_saisie)")
                ->get();
        }

        $heuresParDepartement = DB::table('departement as d')
            ->leftJoin('enseignants as e', 'd.id_depart', '=', 'e.id_depart')
            ->leftJoin('activite_pedagogique as ap', 'e.id_ens', '=', 'ap.id_ens')
            ->leftJoin('parametre as p', 'ap.id_param', '=', 'p.id_param')
            ->select(
                'd.lib_depart as name',
                DB::raw("'' as desc"),
                DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) as hours')
            )
            ->where('e.status', 'ACTIF')
            ->where('p.annee_acad', $anneeInt)
            ->groupBy('d.id_depart', 'd.lib_depart')
            ->get();

        $enseignantsDepassement = DB::table('enseignants as e')
            ->join('grades as g', 'e.id_grade', '=', 'g.id_grade')
            ->join('departement as d', 'e.id_depart', '=', 'd.id_depart')
            ->leftJoin('activite_pedagogique as ap', 'e.id_ens', '=', 'ap.id_ens')
            ->leftJoin('parametre as p', 'ap.id_param', '=', 'p.id_param')
            ->select(
                'e.id_ens',
                'e.nom_ens as nom',
                'e.pren_ens as prenom',
                'd.lib_depart as departement',
                'g.quota_annuel as quota',
                DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) as done'),
                DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) - g.quota_annuel as exceed')
            )
            ->where('e.status', 'ACTIF')
            ->where('p.annee_acad', $anneeInt)
            ->groupBy('e.id_ens', 'e.nom_ens', 'e.pren_ens', 'd.lib_depart', 'g.quota_annuel')
            ->havingRaw('COALESCE(SUM(ap.vol_hor_cal), 0) > g.quota_annuel')
            ->orderByRaw('COALESCE(SUM(ap.vol_hor_cal), 0) - g.quota_annuel DESC')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'volumeHoraireGlobal' => (float) $volumeHoraireGlobal,
                'enseignantsActifs' => (int) $enseignantsActifs,
                'depassementsCritiques' => (int) $depassementsCritiques,
                'productionMensuelle' => $productionMensuelle,
                'heuresParDepartement' => $heuresParDepartement,
                'enseignantsDepassement' => $enseignantsDepassement,
                'anneeAcademique' => $anneeAcademique->year_label,
            ],
        ]);
    }
}