<?php

namespace App\Http\Controllers;

use App\Models\ActivitePedagogique;
use App\Models\Cours;
use App\Models\Departement;
use App\Models\Enseignant;
use App\Models\Grade;
use App\Models\NiveauComplexite;
use App\Models\Statut;
use App\Models\TypeActivite;
use App\Services\VolumeHoraireService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(
        private readonly VolumeHoraireService $volumeHoraireService,
    ) {}

    /* ────────────────────── Fiche enseignant ────────────────────── */

    public function ficheEnseignantExcel(Request $request, int $idEns): StreamedResponse
    {
        $report = $this->ficheEnseignantReport($request, $idEns);

        return $this->csvResponse('fiche-enseignant-'.$idEns.'.csv', $report['headers'], $report['rows']);
    }

    public function ficheEnseignantPdf(Request $request, int $idEns)
    {
        $report = $this->ficheEnseignantReport($request, $idEns);
        $enseignant = Enseignant::query()->select(Enseignant::publicFields())->findOrFail($idEns);
        $grade = Grade::find($enseignant->id_grade)?->lib_grade ?? '—';
        $statut = Statut::find($enseignant->id_statut)?->lib_statut ?? '—';
        $departement = Departement::find($enseignant->id_depart)?->lib_depart ?? '—';

        $pdf = Pdf::loadView('exports.fiche-enseignant', [
            'enseignant' => $enseignant,
            'grade' => $grade,
            'statut' => $statut,
            'departement' => $departement,
            'summary' => $report['summary'],
            'headers' => $report['headers'],
            'rows' => $report['rows'],
            'date' => now()->format('d/m/Y à H\hi'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('fiche-enseignant-'.$idEns.'.pdf');
    }

    /* ────────────────────── État global heures ────────────────────── */

    public function heuresExcel(Request $request): StreamedResponse
    {
        $report = $this->heuresReport($request);

        return $this->csvResponse('etat-global-heures.csv', $report['headers'], $report['rows']);
    }

    public function heuresPdf(Request $request)
    {
        $report = $this->heuresReport($request);
        $filters = $this->validateFilters($request);

        $pdf = Pdf::loadView('exports.etat-heures', [
            'summary' => $report['summary'],
            'headers' => $report['headers'],
            'rows' => $report['rows'],
            'date' => now()->format('d/m/Y à H\hi'),
            'filtres' => $this->buildFiltresLabel($filters),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('etat-global-heures.pdf');
    }

    /* ────────────────────── État des paiements ────────────────────── */

    public function paiementsExcel(Request $request): StreamedResponse
    {
        $report = $this->paiementsReport($request);

        return $this->csvResponse('etat-paiements.csv', $report['headers'], $report['rows']);
    }

    public function paiementsPdf(Request $request)
    {
        $report = $this->paiementsReport($request);
        $filters = $this->validateFilters($request);

        $pdf = Pdf::loadView('exports.etat-paiements', [
            'summary' => $report['summary'],
            'headers' => $report['headers'],
            'rows' => $report['rows'],
            'date' => now()->format('d/m/Y à H\hi'),
            'filtres' => $this->buildFiltresLabel($filters),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('etat-paiements.pdf');
    }

    /* ────────────────────── Productions pédagogiques ────────────────────── */

    public function productionsPdf(Request $request)
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();

        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->get()->keyBy('id_ens');

        $cours = Cours::query()
            ->whereIn('id_cours', $activites->pluck('id_cours')->unique()->values())
            ->get()->keyBy('id_cours');

        $types = TypeActivite::query()
            ->whereIn('id_typ_activite', $activites->pluck('id_typ_activite')->unique()->values())
            ->get()->keyBy('id_typ_activite');

        $niveaux = NiveauComplexite::query()
            ->whereIn('id_niv_complex', $activites->pluck('id_niv_complex')->filter()->unique()->values())
            ->get()->keyBy('id_niv_complex');

        $rows = $activites->map(fn (ActivitePedagogique $a): array => [
            'enseignant' => trim(($enseignants->get($a->id_ens)?->nom_ens ?? '').' '.($enseignants->get($a->id_ens)?->pren_ens ?? '')),
            'cours' => $cours->get($a->id_cours)?->int_cours ?? "Cours #{$a->id_cours}",
            'type' => $types->get($a->id_typ_activite)?->lib_activite ?? "Type #{$a->id_typ_activite}",
            'complexite' => $niveaux->get($a->id_niv_complex)?->lib_niv_complex ?? '—',
            'volume' => round((float) $a->vol_hor_cal, 2),
            'statut' => $a->statut === 'approuve' ? 'Validé' : 'En attente',
            'date' => optional($a->date_saisie)->format('d/m/Y'),
        ])->values()->all();

        $totalVH = round(collect($rows)->sum('volume'), 2);
        $nbValides = collect($rows)->where('statut', 'Validé')->count();
        $nbEnAttente = collect($rows)->where('statut', 'En attente')->count();

        $pdf = Pdf::loadView('exports.productions', [
            'rows' => $rows,
            'total_vh' => $totalVH,
            'nb_valides' => $nbValides,
            'nb_en_attente' => $nbEnAttente,
            'filtres' => $this->buildFiltresLabel($filters),
            'date' => now()->format('d/m/Y à H\hi'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('productions-pedagogiques.pdf');
    }

    /* ────────────────────── Statistiques pédagogiques ────────────────────── */

    public function statistiquesPdf(Request $request)
    {
        $filters = $this->validateFilters($request);
        $activites = $this->filteredActivities($filters)->get();

        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->get()
            ->keyBy('id_ens');

        $typesActivites = TypeActivite::query()
            ->whereIn('id_typ_activite', $activites->pluck('id_typ_activite')->unique()->values())
            ->get()
            ->keyBy('id_typ_activite');

        $departements = Departement::query()
            ->whereIn('id_depart', $enseignants->pluck('id_depart')->unique()->values())
            ->get()
            ->keyBy('id_depart');

        $items = $activites->map(fn (ActivitePedagogique $a): array => [
            'activite' => $a,
            'volume_horaire' => $this->volumeHoraireService->resolvedActivityVolume($a),
        ]);

        $totalHeures = round($items->sum('volume_horaire'), 2);

        $parType = $items
            ->groupBy(fn (array $item): int => $item['activite']->id_typ_activite)
            ->map(fn ($group, int $idType): array => [
                'label' => $typesActivites->get($idType)?->lib_activite ?? "Type #$idType",
                'count' => $group->count(),
                'volume' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $parDepart = $items
            ->groupBy(function (array $item) use ($enseignants): int {
                return (int) ($enseignants->get($item['activite']->id_ens)?->id_depart ?? 0);
            })
            ->map(fn ($group, int $idDepart): array => [
                'label' => $departements->get($idDepart)?->lib_depart ?? "Département #$idDepart",
                'count' => $group->count(),
                'volume' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortByDesc('volume')
            ->values()
            ->all();

        $parMois = $items
            ->groupBy(fn (array $item): string => $item['activite']->date_saisie->format('Y-m'))
            ->map(fn ($group, string $mois): array => [
                'mois' => $mois,
                'count' => $group->count(),
                'volume' => round($group->sum('volume_horaire'), 2),
            ])
            ->sortBy('mois')
            ->values()
            ->all();

        $pdf = Pdf::loadView('exports.statistiques', [
            'total_enseignants' => $enseignants->count(),
            'total_heures' => $totalHeures,
            'total_activites' => $activites->count(),
            'par_type' => $parType,
            'par_departement' => $parDepart,
            'par_mois' => $parMois,
            'filtres' => $this->buildFiltresLabel($filters),
            'date' => now()->format('d/m/Y à H\hi'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('statistiques-pedagogiques.pdf');
    }

    /* ────────────────────── Taux horaires (barème) ────────────────────── */

    public function tauxHorairesPdf(Request $request)
    {
        $grades = Grade::orderBy('lib_grade')->get();

        $admin = null;
        if ($request->user()) {
            $u = $request->user();
            $admin = trim(($u->pren_adm ?? '').' '.($u->nom_adm ?? ''));
            if (empty(trim($admin))) {
                $admin = $u->user_log_adm ?? null;
            }
        }

        $pdf = Pdf::loadView('exports.taux-horaires', [
            'grades' => $grades,
            'date' => now()->format('d/m/Y à H\hi'),
            'admin' => $admin,
        ])->setPaper('a4', 'portrait');

        return $pdf->download('bareme-taux-horaires.pdf');
    }

    /* ────────────────────── Données communes ────────────────────── */

    private function ficheEnseignantReport(Request $request, int $idEns): array
    {
        $filters = $this->validateFilters($request);
        $enseignant = Enseignant::query()->select(Enseignant::publicFields())->findOrFail($idEns);
        $activites = $this->filteredActivities($filters)->where('id_ens', $idEns)->get();

        // Résolution des libellés
        $cours = Cours::query()
            ->whereIn('id_cours', $activites->pluck('id_cours')->unique()->values())
            ->get()->keyBy('id_cours');

        $types = TypeActivite::query()
            ->whereIn('id_typ_activite', $activites->pluck('id_typ_activite')->unique()->values())
            ->get()->keyBy('id_typ_activite');

        $headers = ['ID', 'Cours', 'Type activité', 'Date', 'Volume horaire'];
        $rows = $activites->map(fn (ActivitePedagogique $activite): array => [
            $activite->id_activite,
            $cours->get($activite->id_cours)?->int_cours ?? "Cours #{$activite->id_cours}",
            $types->get($activite->id_typ_activite)?->lib_activite ?? "Type #{$activite->id_typ_activite}",
            optional($activite->date_saisie)->format('d/m/Y'),
            $this->volumeHoraireService->resolvedActivityVolume($activite),
        ])->values()->all();

        $total = collect($rows)->sum(fn (array $row): float => (float) $row[4]);

        return [
            'summary' => [
                'enseignant' => trim($enseignant->nom_ens.' '.$enseignant->pren_ens),
                'volume_total_heures' => round($total, 2),
                'taux_horaire' => round($enseignant->tauxEffectif(), 2),
                'montant_estime' => round($total * $enseignant->tauxEffectif(), 2),
            ],
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    private function heuresReport(Request $request): array
    {
        $filters = $this->validateFilters($request);
        $rows = $this->summaryRows($filters, false);

        return [
            'summary' => [
                'nombre_enseignants' => count($rows),
                'volume_total_heures' => round(collect($rows)->sum(fn (array $row): float => (float) $row[4]), 2),
            ],
            'headers' => ['ID enseignant', 'Nom', 'Prenom', 'Nombre activites', 'Volume total'],
            'rows' => $rows,
        ];
    }

    private function paiementsReport(Request $request): array
    {
        $filters = $this->validateFilters($request);
        $rows = $this->summaryRows($filters, true);

        return [
            'summary' => [
                'nombre_enseignants' => count($rows),
                'montant_total_estime' => round(collect($rows)->sum(fn (array $row): float => (float) $row[6]), 2),
            ],
            'headers' => ['ID enseignant', 'Nom', 'Prenom', 'Nombre activites', 'Volume total', 'Taux horaire', 'Montant estime'],
            'rows' => $rows,
        ];
    }

    private function summaryRows(array $filters, bool $withPayment): array
    {
        $activites = $this->filteredActivities($filters)->get();
        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->whereIn('id_ens', $activites->pluck('id_ens')->unique()->values())
            ->get()
            ->keyBy('id_ens');

        return $activites
            ->groupBy('id_ens')
            ->map(function ($items, int $idEns) use ($enseignants, $withPayment): array {
                $enseignant = $enseignants->get($idEns);
                $volume = $items->sum(fn (ActivitePedagogique $activite): float => $this->volumeHoraireService->resolvedActivityVolume($activite));
                $base = [
                    $idEns,
                    $enseignant->nom_ens ?? '',
                    $enseignant->pren_ens ?? '',
                    $items->count(),
                    round($volume, 2),
                ];

                if (! $withPayment) {
                    return $base;
                }

                $taux = $enseignant ? $enseignant->tauxEffectif() : 0;

                return [...$base, round($taux, 2), round($volume * $taux, 2)];
            })
            ->values()
            ->all();
    }

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'id_param' => ['sometimes', 'required', 'integer', 'exists:parametre,id_param'],
            'date_debut' => ['sometimes', 'required', 'date'],
            'date_fin' => ['sometimes', 'required', 'date', 'after_or_equal:date_debut'],
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

    private function buildFiltresLabel(array $filters): string
    {
        $parts = [];
        if (isset($filters['date_debut'])) {
            $parts[] = 'Du '.$filters['date_debut'];
        }
        if (isset($filters['date_fin'])) {
            $parts[] = 'au '.$filters['date_fin'];
        }
        if (isset($filters['id_param'])) {
            $parts[] = 'Paramètre #'.$filters['id_param'];
        }

        return implode(' ', $parts);
    }

    private function csvResponse(string $filename, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($handle, $row, ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
