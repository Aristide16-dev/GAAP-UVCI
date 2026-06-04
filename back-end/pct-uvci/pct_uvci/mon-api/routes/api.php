<?php

/**
 * api.php — Toutes les routes de l'API REST du projet GAAP-UVCI
 *
 * Ce fichier déclare TOUTES les URLs que le frontend peut appeler.
 * Chaque route est associée à un contrôleur qui traite la requête.
 *
 * PROTECTION DES ROUTES :
 * - auth:sanctum   → vérifie que l'utilisateur est connecté (token valide)
 * - role:xxx       → vérifie que l'utilisateur a le bon rôle
 * - throttle:10,1  → limite à 10 requêtes par minute (anti-brute-force)
 * - enseignant.owner → vérifie qu'un enseignant accède seulement à ses données
 *
 * CONVENTION REST utilisée dans ce projet :
 * - GET    → lire des données
 * - POST   → créer une nouvelle ressource
 * - PUT    → modifier entièrement une ressource
 * - PATCH  → modifier partiellement une ressource
 * - DELETE → supprimer une ressource
 */

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\ActivitePedagogiqueController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoursController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\EnseignantController;
use App\Http\Controllers\EtatController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\NiveauComplexiteController;
use App\Http\Controllers\NiveauEtudeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ParametreController;
use App\Http\Controllers\RessourceController;
use App\Http\Controllers\SequenceCoursController;
use App\Http\Controllers\StatutController;
use App\Http\Controllers\TypeActiviteController;
use App\Http\Controllers\TypeRessourceController;
use App\Http\Controllers\VolumeHoraireController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Route utilitaire : retourner l'utilisateur connecté ──────────────────────
// Utilisé par Sanctum pour vérifier la session côté frontend
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ─── Connexion (publique, mais limitée à 10 tentatives/minute) ────────────────
// Le throttle protège contre les attaques par force brute (deviner un mot de passe)
Route::middleware('throttle:10,1')->post('/login', [AuthController::class, 'login']);

// ─── Inscription (réservée aux admins connectés) ──────────────────────────────
// Seul un administrateur authentifié peut créer de nouveaux comptes
Route::middleware(['auth:sanctum', 'role:administrateur'])->post('/register', [AuthController::class, 'register']);

// ─── Routes protégées (utilisateur connecté requis pour tout ce qui suit) ─────
Route::middleware('auth:sanctum')->group(function () {

    // Déconnexion — invalide le token côté serveur
    Route::post('/logout', [AuthController::class, 'logout']);

    // Modification du profil de l'utilisateur connecté
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── Section admin + secrétaire (les deux rôles y ont accès) ──────────────

    Route::middleware('role:administrateur,secretaire')->group(function () {

        // Gestion des comptes utilisateurs (liste, création, modification, statut, suppression)
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
        Route::patch('/admin/users/{id}/status', [AdminUserController::class, 'toggleStatus']);
        Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);

        // Gestion des années académiques (une seule peut être active à la fois)
        Route::get('/academic-years', [AcademicYearController::class, 'index']);
        Route::post('/academic-years', [AcademicYearController::class, 'store']);
        Route::put('/academic-years/{id}', [AcademicYearController::class, 'update']);
        Route::patch('/academic-years/{id}/activate', [AcademicYearController::class, 'activate']);
        Route::patch('/academic-years/{id}/deactivate', [AcademicYearController::class, 'deactivate']);
        Route::delete('/academic-years/{id}', [AcademicYearController::class, 'destroy']);

        // Historique des niveaux de complexité (suppression d'entrées)
        Route::delete('/niveaux-complexite-history/clear', [NiveauComplexiteController::class, 'clearNiveauxComplexiteHistory']);
        Route::delete('/niveaux-complexite-history/{id}', [NiveauComplexiteController::class, 'deleteNiveauxComplexiteHistory']);
    });

    Route::middleware('role:administrateur,secretaire')->group(function () {

        // Gestion des enseignants
        Route::get('/enseignants', [EnseignantController::class, 'index']);
        Route::post('/enseignants', [EnseignantController::class, 'store']);
        Route::put('/enseignants/{idEns}', [EnseignantController::class, 'update']);
        Route::patch('/enseignants/{idEns}', [EnseignantController::class, 'update']);
        Route::delete('/enseignants/{idEns}', [EnseignantController::class, 'destroy']);

        // Gestion des grades (barèmes horaires) et leur historique de modifications
        Route::get('/grades/history', [GradeController::class, 'history']);
        Route::delete('/grades/history', [GradeController::class, 'clearHistory']);
        Route::delete('/grades/history/{id}', [GradeController::class, 'deleteHistory']);
        Route::get('/grades', [GradeController::class, 'index']);
        Route::post('/grades', [GradeController::class, 'store']);
        Route::get('/grades/{idGrade}', [GradeController::class, 'show']);
        Route::put('/grades/{idGrade}', [GradeController::class, 'update']);
        Route::patch('/grades/{idGrade}', [GradeController::class, 'update']);
        Route::delete('/grades/{idGrade}', [GradeController::class, 'destroy']);

        // Statuts d'enseignants (Permanent, Vacataire, etc.)
        Route::get('/statuts', [StatutController::class, 'index']);
        Route::post('/statuts', [StatutController::class, 'store']);
        Route::get('/statuts/{idStatut}', [StatutController::class, 'show']);
        Route::put('/statuts/{idStatut}', [StatutController::class, 'update']);
        Route::patch('/statuts/{idStatut}', [StatutController::class, 'update']);
        Route::delete('/statuts/{idStatut}', [StatutController::class, 'destroy']);

        // Départements de l'université
        Route::get('/departements', [DepartementController::class, 'index']);
        Route::post('/departements', [DepartementController::class, 'store']);
        Route::get('/departements/{idDepart}', [DepartementController::class, 'show']);
        Route::put('/departements/{idDepart}', [DepartementController::class, 'update']);
        Route::patch('/departements/{idDepart}', [DepartementController::class, 'update']);
        Route::delete('/departements/{idDepart}', [DepartementController::class, 'destroy']);

        // Niveaux d'études (Licence 1, Licence 2, Master 1, etc.)
        Route::get('/niveaux', [NiveauEtudeController::class, 'index']);
        Route::post('/niveaux', [NiveauEtudeController::class, 'store']);
        Route::get('/niveaux/{idNiveau}', [NiveauEtudeController::class, 'show']);
        Route::put('/niveaux/{idNiveau}', [NiveauEtudeController::class, 'update']);
        Route::patch('/niveaux/{idNiveau}', [NiveauEtudeController::class, 'update']);
        Route::delete('/niveaux/{idNiveau}', [NiveauEtudeController::class, 'destroy']);

        // Cours (matières enseignées)
        Route::get('/cours', [CoursController::class, 'index']);
        Route::post('/cours', [CoursController::class, 'store']);
        Route::get('/cours/{idCours}', [CoursController::class, 'show']);
        Route::put('/cours/{idCours}', [CoursController::class, 'update']);
        Route::patch('/cours/{idCours}', [CoursController::class, 'update']);
        Route::delete('/cours/{idCours}', [CoursController::class, 'destroy']);

        // Séquences de cours (découpage d'un cours en séquences)
        Route::get('/sequences-cours', [SequenceCoursController::class, 'index']);
        Route::post('/sequences-cours', [SequenceCoursController::class, 'store']);
        Route::get('/sequences-cours/{idSeq}', [SequenceCoursController::class, 'show']);
        Route::put('/sequences-cours/{idSeq}', [SequenceCoursController::class, 'update']);
        Route::patch('/sequences-cours/{idSeq}', [SequenceCoursController::class, 'update']);
        Route::delete('/sequences-cours/{idSeq}', [SequenceCoursController::class, 'destroy']);

        // Types de ressources pédagogiques (Cours Magistral, TD, TP, etc.)
        Route::get('/types-ressources', [TypeRessourceController::class, 'index']);
        Route::post('/types-ressources', [TypeRessourceController::class, 'store']);
        Route::get('/types-ressources/{idTypRes}', [TypeRessourceController::class, 'show']);
        Route::put('/types-ressources/{idTypRes}', [TypeRessourceController::class, 'update']);
        Route::patch('/types-ressources/{idTypRes}', [TypeRessourceController::class, 'update']);
        Route::delete('/types-ressources/{idTypRes}', [TypeRessourceController::class, 'destroy']);

        // Ressources pédagogiques (supports de cours spécifiques)
        Route::get('/ressources', [RessourceController::class, 'index']);
        Route::post('/ressources', [RessourceController::class, 'store']);
        Route::get('/ressources/{idRes}', [RessourceController::class, 'show']);
        Route::put('/ressources/{idRes}', [RessourceController::class, 'update']);
        Route::patch('/ressources/{idRes}', [RessourceController::class, 'update']);
        Route::delete('/ressources/{idRes}', [RessourceController::class, 'destroy']);

        // Niveaux de complexité et leur historique (coefficients de calcul du volume horaire)
        Route::get('/niveaux-complexite/history', [NiveauComplexiteController::class, 'history']);
        Route::get('/niveaux-complexite', [NiveauComplexiteController::class, 'index']);
        Route::post('/niveaux-complexite', [NiveauComplexiteController::class, 'store']);
        Route::get('/niveaux-complexite/{idNivComplex}', [NiveauComplexiteController::class, 'show']);
        Route::put('/niveaux-complexite/{idNivComplex}', [NiveauComplexiteController::class, 'update']);
        Route::patch('/niveaux-complexite/{idNivComplex}', [NiveauComplexiteController::class, 'update']);
        Route::delete('/niveaux-complexite/{idNivComplex}', [NiveauComplexiteController::class, 'destroy']);

        // Types d'activités pédagogiques (Cours, Encadrement de stage, etc.)
        Route::get('/types-activites', [TypeActiviteController::class, 'index']);
        Route::post('/types-activites', [TypeActiviteController::class, 'store']);
        Route::get('/types-activites/{idTypActivite}', [TypeActiviteController::class, 'show']);
        Route::put('/types-activites/{idTypActivite}', [TypeActiviteController::class, 'update']);
        Route::patch('/types-activites/{idTypActivite}', [TypeActiviteController::class, 'update']);
        Route::delete('/types-activites/{idTypActivite}', [TypeActiviteController::class, 'destroy']);

        // Paramètres de calcul (coefficients académiques par année)
        Route::get('/parametres', [ParametreController::class, 'index']);
        Route::post('/parametres', [ParametreController::class, 'store']);
        Route::get('/parametres/{idParam}', [ParametreController::class, 'show']);
        Route::put('/parametres/{idParam}', [ParametreController::class, 'update']);
        Route::patch('/parametres/{idParam}', [ParametreController::class, 'update']);
        Route::delete('/parametres/{idParam}', [ParametreController::class, 'destroy']);

        // Activités pédagogiques saisies (cœur du système : ce que les enseignants ont fait)
        Route::get('/activites-pedagogiques', [ActivitePedagogiqueController::class, 'index']);
        Route::post('/activites-pedagogiques', [ActivitePedagogiqueController::class, 'store']);
        Route::get('/activites-pedagogiques/{idActivite}', [ActivitePedagogiqueController::class, 'show']);
        Route::put('/activites-pedagogiques/{idActivite}', [ActivitePedagogiqueController::class, 'update']);
        Route::patch('/activites-pedagogiques/{idActivite}', [ActivitePedagogiqueController::class, 'update']);
        Route::delete('/activites-pedagogiques/{idActivite}', [ActivitePedagogiqueController::class, 'destroy']);

        // Volumes horaires globaux (calcul total des heures)
        Route::get('/volumes-horaires', [VolumeHoraireController::class, 'index']);

        // Dashboard secrétaire (statistiques de l'année en cours)
        Route::get('/dashboard', [DashboardController::class, 'secretaireDashboard']);

        // Notification aux enseignants dépassant leur quota annuel
        Route::post('/notifications/notify-exceeding', [NotificationController::class, 'notifyExceedingTeachers']);

        // États (rapports) de données — lecture seule
        Route::get('/etats/heures', [EtatController::class, 'etatGlobalHeures']);
        Route::get('/etats/paiements', [EtatController::class, 'etatPaiements']);
        Route::get('/etats/statistiques-pedagogiques', [EtatController::class, 'statistiquesPedagogiques']);

        // Exports Excel et PDF générés côté serveur via DomPDF + PhpSpreadsheet
        Route::get('/exports/heures/excel', [ExportController::class, 'heuresExcel']);
        Route::get('/exports/heures/pdf', [ExportController::class, 'heuresPdf']);
        Route::get('/exports/paiements/excel', [ExportController::class, 'paiementsExcel']);
        Route::get('/exports/paiements/pdf', [ExportController::class, 'paiementsPdf']);
        Route::get('/exports/statistiques/pdf', [ExportController::class, 'statistiquesPdf']);
        Route::get('/exports/productions/pdf', [ExportController::class, 'productionsPdf']);
        Route::get('/exports/taux-horaires/pdf', [ExportController::class, 'tauxHorairesPdf']);
    });

    // ── Section accessible aux 3 rôles (avec restriction propriétaire pour l'enseignant) ──
    // enseignant.owner vérifie qu'un enseignant ne peut voir que SES propres données
    Route::middleware(['role:administrateur,secretaire,enseignant', 'enseignant.owner'])->group(function () {
        Route::get('/enseignants/{idEns}', [EnseignantController::class, 'show']);
        Route::get('/enseignants/{idEns}/volume-horaire', [VolumeHoraireController::class, 'show']);
        Route::get('/etats/enseignants/{idEns}', [EtatController::class, 'ficheEnseignant']);
        Route::get('/exports/enseignants/{idEns}/excel', [ExportController::class, 'ficheEnseignantExcel']);
        Route::get('/exports/enseignants/{idEns}/pdf', [ExportController::class, 'ficheEnseignantPdf']);
    });
});
