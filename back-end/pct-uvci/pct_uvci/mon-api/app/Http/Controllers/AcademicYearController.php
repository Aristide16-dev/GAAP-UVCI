<?php
namespace App\Http\Controllers;
use App\Models\AcademicYear;
use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AcademicYearController extends Controller
{
    public function index() {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $allYears = AcademicYear::orderBy('year_label', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_year' => $activeYear ? $activeYear->year_label : null,
                'years' => $allYears->map(function($year) {
                    return [
                        'id'                  => $year->id,
                        'year_label'          => $year->year_label,
                        'odd_semester_start'  => $year->odd_semester_start ? $year->odd_semester_start->format('Y-m-d') : null,
                        'odd_semester_end'    => $year->odd_semester_end ? $year->odd_semester_end->format('Y-m-d') : null,
                        'even_semester_start' => $year->even_semester_start ? $year->even_semester_start->format('Y-m-d') : null,
                        'even_semester_end'   => $year->even_semester_end ? $year->even_semester_end->format('Y-m-d') : null,
                        'is_active'           => $year->is_active,
                    ];
                })->toArray()
            ]
        ]);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'year_label'          => 'required|string|unique:academic_years,year_label',
            'odd_semester_start'  => 'required|date',
            'odd_semester_end'    => 'required|date|after:odd_semester_start',
            'even_semester_start' => 'required|date',
            'even_semester_end'   => 'required|date|after:even_semester_start',
            'is_active'           => 'boolean',
        ]);

        if (isset($validated['is_active']) && $validated['is_active']) {
            AcademicYear::query()->update(['is_active' => false]);
        }

        $year = AcademicYear::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Année académique créée',
            'data'    => $year,
        ], 201);
    }

    public function update(Request $request, $id) {
        $year = AcademicYear::findOrFail($id);

        $validated = $request->validate([
            'year_label'          => ['sometimes', 'string', Rule::unique('academic_years', 'year_label')->ignore($year->id)],
            'odd_semester_start'  => 'sometimes|date',
            'odd_semester_end'    => 'sometimes|date',
            'even_semester_start' => 'sometimes|date',
            'even_semester_end'   => 'sometimes|date',
            'is_active'           => 'sometimes|boolean',
        ]);

        $year->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Année mise à jour',
            'data'    => $year,
        ]);
    }

    public function activate($id) {
        AcademicYear::query()->update(['is_active' => false]);

        $year = AcademicYear::findOrFail($id);
        $year->is_active = true;
        $year->save();

        $anneeInt    = (int) substr($year->year_label, 0, 4);
        $userLogAdm  = Auth::user()->user_log_adm ?? Auth::user()->user_log_adm ?? 'admin';

        Parametre::firstOrCreate(
            ['annee_acad' => $anneeInt],
            [
                'user_log_adm'    => $userLogAdm,
                'annee_acad'      => $anneeInt,
                'taux_hor_defaut' => 15000,
                'date_debut'      => $anneeInt . '-09-01',
                'date_fin'        => ($anneeInt + 1) . '-06-30',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Année activée et paramètre créé automatiquement',
        ]);
    }

    public function deactivate($id) {
        $year = AcademicYear::findOrFail($id);
        $year->is_active = false;
        $year->save();

        return response()->json([
            'success' => true,
            'message' => 'Année désactivée',
        ]);
    }

    public function destroy($id) {
        $year = AcademicYear::findOrFail($id);

        if ($year->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer l\'année active',
            ], 400);
        }

        $year->delete();

        return response()->json([
            'success' => true,
            'message' => 'Année supprimée',
        ]);
    }
}