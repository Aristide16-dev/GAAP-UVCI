<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function notifyExceedingTeachers(Request $request): JsonResponse
    {
        $anneeAcademique = DB::table('academic_years')
            ->where('is_active', true)
            ->first();

        if (! $anneeAcademique) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune année académique active',
            ], 400);
        }

        $anneeInt = (int) substr($anneeAcademique->year_label, 0, 4);

        // Récupérer les enseignants qui ont dépassé leur quota
        $enseignantsDepassement = DB::table('enseignants as e')
            ->join('grades as g', 'e.id_grade', '=', 'g.id_grade')
            ->leftJoin('activite_pedagogique as ap', 'e.id_ens', '=', 'ap.id_ens')
            ->leftJoin('parametre as p', 'ap.id_param', '=', 'p.id_param')
            ->select(
                'e.id_ens',
                'e.nom_ens as nom',
                'e.pren_ens as prenom',
                'e.email_ens as email',
                'g.quota_annuel as quota',
                DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) as done'),
                DB::raw('COALESCE(SUM(ap.vol_hor_cal), 0) - g.quota_annuel as exceed')
            )
            ->where('e.status', 'ACTIF')
            ->where('p.annee_acad', $anneeInt)
            ->whereNotNull('e.email_ens')
            ->groupBy('e.id_ens', 'e.nom_ens', 'e.pren_ens', 'e.email_ens', 'g.quota_annuel')
            ->havingRaw('COALESCE(SUM(ap.vol_hor_cal), 0) > g.quota_annuel')
            ->get();

        if ($enseignantsDepassement->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun enseignant avec dépassement de quota',
            ], 404);
        }

        // Simuler l'envoi d'emails (à remplacer par un véritable système d'envoi d'emails)
        $notificationsEnvoyees = [];
        foreach ($enseignantsDepassement as $enseignant) {
            // Ici vous pouvez intégrer un véritable système d'envoi d'emails
            // comme Laravel Mail, SendGrid, etc.
            $notificationsEnvoyees[] = [
                'email' => $enseignant->email,
                'nom' => $enseignant->nom,
                'prenom' => $enseignant->prenom,
                'quota' => $enseignant->quota,
                'realise' => round($enseignant->done, 2),
                'exces' => round($enseignant->exceed, 2),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => count($notificationsEnvoyees).' notifications envoyées avec succès',
            'data' => [
                'notifications' => $notificationsEnvoyees,
                'total' => count($notificationsEnvoyees),
            ],
        ]);
    }
}
