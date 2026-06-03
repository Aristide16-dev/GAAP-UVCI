<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EnseignantController extends Controller
{
    public function index(): JsonResponse
    {
        $enseignants = Enseignant::query()
            ->select(Enseignant::publicFields())
            ->orderBy('id_ens')
            ->get();

        return response()->json([
            'message' => 'Liste des enseignants.',
            'data' => $enseignants,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_grade' => ['required', 'integer', 'exists:grades,id_grade'],            'id_statut' => ['required', 'integer', 'exists:statut,id_statut'],
            'id_depart' => ['required', 'integer', 'exists:departement,id_depart'],
            'user_log_ens' => ['required', 'string', 'max:50', 'unique:enseignants,user_log_ens'],
            'user_pasw_ens' => ['required', 'string', 'min:8'],
            'nom_ens' => ['required', 'string', 'max:100'],
            'pren_ens' => ['required', 'string', 'max:100'],
            'email_ens' => ['required', 'email', 'max:150', 'unique:enseignants,email_ens'],
            'tel_ens' => ['required', 'string', 'max:20'],
            'taux_hor_ens' => ['required', 'numeric'],
        ]);

        $data['user_pasw_ens'] = Hash::make($data['user_pasw_ens']);
        $data['status'] = 'ACTIF';

        $enseignant = Enseignant::query()->create($data);

        return response()->json([
            'message' => 'Enseignant créé avec succès.',
            'data' => $this->findEnseignant($enseignant->id_ens),
        ], 201);
    }

    public function show(int $idEns): JsonResponse
    {
        $enseignant = $this->findEnseignant($idEns);

        if (! $enseignant) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'message' => 'Enseignant trouve.',
            'data' => $enseignant,
        ]);
    }

    public function update(Request $request, int $idEns): JsonResponse
    {
        $enseignant = Enseignant::query()->find($idEns);

        if (! $enseignant) {
            return $this->notFoundResponse();
        }

        $data = $request->validate([
            'user_log_adm' => ['sometimes', 'required', 'string', 'max:50', 'exists:administrateur,user_log_adm'],
            'user_log_sp' => ['sometimes', 'required', 'string', 'max:50', 'exists:secretaire_principal,user_log_sp'],
            'id_grade' => ['sometimes', 'required', 'integer', 'exists:grades,id_grade'],
            'id_statut' => ['sometimes', 'required', 'integer', 'exists:statut,id_statut'],
            'id_depart' => ['sometimes', 'required', 'integer', 'exists:departement,id_depart'],
            'user_log_ens' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('enseignants', 'user_log_ens')->ignore($idEns, 'id_ens'),
            ],
            'user_pasw_ens' => ['sometimes', 'nullable', 'string', 'min:8'],
            'nom_ens' => ['sometimes', 'required', 'string', 'max:100'],
            'pren_ens' => ['sometimes', 'required', 'string', 'max:100'],
            'email_ens' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('enseignants', 'email_ens')->ignore($idEns, 'id_ens'),
            ],
            'tel_ens' => ['sometimes', 'required', 'string', 'max:20'],
            'taux_hor_ens' => ['sometimes', 'required', 'numeric'],
        ]);

        if (array_key_exists('user_pasw_ens', $data)) {
            $data['user_pasw_ens'] = Hash::make($data['user_pasw_ens']);
        }

        $enseignant->fill($data);
        $enseignant->save();

        return response()->json([
            'message' => 'Enseignant modifie avec succes.',
            'data' => $this->findEnseignant($idEns),
        ]);
    }

    public function destroy(int $idEns): JsonResponse
    {
        $enseignant = Enseignant::query()->find($idEns);

        if (! $enseignant) {
            return $this->notFoundResponse();
        }

        $enseignant->delete();

        return response()->json([
            'message' => 'Enseignant supprime avec succes.',
        ]);
    }

    private function findEnseignant(int $idEns): ?Enseignant
    {
        return Enseignant::query()
            ->select(Enseignant::publicFields())
            ->find($idEns);
    }

    private function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Enseignant introuvable.',
        ], 404);
    }
}
