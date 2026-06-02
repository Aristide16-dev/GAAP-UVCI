import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  BookOpen,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "../../components/SkeletonLoader";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";

interface VolumeHoraireData {
  enseignant: {
    nom_ens: string;
    pren_ens: string;
    id_grade: number;
    taux_hor_ens: number;
  };
  nombre_activites: number;
  volume_total_heures: number;
  taux_horaire: number;
  montant_estime: number;
  activites: Activite[];
}

interface Activite {
  id_activite: number;
  id_cours: number;
  id_typ_activite: number;
  date_saisie: string;
  vol_hor_cal: string | number; // Corrigé pour matcher le backend
  statut?: string;
}

interface Grade {
  id_grade: number;
  lib_grade: string;
  quota_annuel: number;
}
interface Cours {
  id_cours: number;
  int_cours: string;
}
interface TypeActivite {
  id_typ_activite: number;
  lib_activite: string;
}

export default function EnseignantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const idEns = (user as any)?.id_ens;
  const nomEns = (user as any)?.nom_ens ?? "";
  const prenEns = (user as any)?.pren_ens ?? "";
  const idGrade = (user as any)?.id_grade;

  const [volumeData, setVolumeData] = useState<VolumeHoraireData | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [typesActivite, setTypesActivite] = useState<TypeActivite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!idEns) return;
    try {
      setLoading(true);
      const [volRes, coursRes, typesRes, gradesRes] = await Promise.all([
        api.get(`/enseignants/${idEns}/volume-horaire`),
        api.get("/cours"),
        api.get("/types-activites"),
        idGrade ? api.get("/grades").catch(() => null) : Promise.resolve(null),
      ]);
      setVolumeData(volRes.data.data ?? null);
      setCours(coursRes.data.data ?? []);
      setTypesActivite(typesRes.data.data ?? []);

      if (gradesRes) {
        const listGrades: Grade[] = gradesRes.data.data ?? [];
        const currentGrade = listGrades.find((g) => Number(g.id_grade) === Number(idGrade));
        if (currentGrade) setGrade(currentGrade);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  }, [idEns, idGrade]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <DashboardSkeleton />;

  const quota = grade?.quota_annuel ?? 192;
  const heuresValidees = volumeData?.volume_total_heures ?? 0;
  const pourcentage = quota > 0 ? Math.min((heuresValidees / quota) * 100, 110) : 0;
  const heuresCompl = Math.max(heuresValidees - quota, 0);
  const activites = volumeData?.activites ?? [];

  const getCoursLabel = (idCours: number) =>
    cours.find((c) => Number(c.id_cours) === Number(idCours))?.int_cours ??
    `Cours #${idCours}`;
  const getTypeLabel = (idType: number) =>
    typesActivite.find((t) => Number(t.id_typ_activite) === Number(idType))
      ?.lib_activite ?? "—";

  return (
    <div className="space-y-8 text-base-content">
      {heuresCompl > 0 && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 animate-slide-up">
          <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-warning">Quota dépassé</p>
            <p className="text-sm text-base-content/70 mt-0.5">
              Vous avez effectué <span className="font-black text-warning">+{heuresCompl.toFixed(1)}h</span> au-delà de votre quota de {quota}h.
              Ces heures sont comptabilisées comme heures complémentaires rémunérées.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 animate-slide-up anim-d1">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-base-content tracking-tight">
            Bienvenue,<span className="text-primary">{prenEns} {nomEns}</span>
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Visualisez vos performances pédagogiques et gérez vos heures de
            cours en temps réel.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="btn btn-ghost bg-base-100/50 hover:bg-base-300 gap-2 shrink-0"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-slide-up anim-d2">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300/30 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-md font-bold">Jauge de Charge Annuelle</h3>
                <span className="text-[10px] opacity-50">
                  {grade?.lib_grade ?? "Enseignant"} — Quota : {quota}h
                </span>
              </div>
              <span className="text-2xl font-black text-primary">
                {Math.round(pourcentage)}%
              </span>
            </div>
            <div className="w-full bg-base-200 h-3 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${pourcentage >= 100 ? "bg-success" : "bg-primary"}`}
                style={{ width: `${Math.min(pourcentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-semibold px-0.5 mb-6">
              <span className="opacity-60">
                {heuresValidees.toFixed(1)}h Validées
              </span>
              <span className="opacity-40">Objectif: {quota}h</span>
            </div>
          </div>
          <div
            className={`border rounded-xl p-4 flex items-start gap-3 ${
              heuresCompl > 0
                ? "bg-success/5 border-success/20"
                : "bg-primary/5 border-primary/10"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white ${
                heuresCompl > 0 ? "bg-success" : "bg-primary"
              }`}
            >
              {heuresCompl > 0 ? "✓" : "i"}
            </div>
            <p
              className={`text-sm leading-relaxed font-medium ${heuresCompl > 0 ? "text-success" : ""}`}
            >
              {heuresCompl > 0
                ? `Vous avez ${heuresCompl.toFixed(1)}h complémentaires au-delà du quota de ${quota}h.`
                : `Il vous reste ${(quota - heuresValidees).toFixed(1)}h pour atteindre votre quota annuel.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-300/30 p-5 flex flex-col items-center text-center justify-center flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm opacity-50 font-medium">
              Volume total d'heures
            </span>
            <span className="text-3xl font-black mt-1">
              {heuresValidees.toFixed(1)}h
            </span>
            {heuresCompl > 0 && (
              <span className="badge badge-success badge-sm mt-2 font-bold">
                +{heuresCompl.toFixed(1)}h HC
              </span>
            )}
          </div>
          <div className="card bg-base-100 shadow-sm border border-base-300/30 p-5 flex flex-col items-center text-center justify-center flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm opacity-50 font-medium">
              Productions enregistrées
            </span>
            <span className="text-3xl font-black mt-1">
              {volumeData?.nombre_activites ?? 0}
            </span>
          </div>
          <div className="card bg-base-100 shadow-sm border border-base-300/30 p-5 flex flex-col items-center text-center justify-center flex-1">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm opacity-50 font-medium">
              Montant estimé
            </span>
            <span className="text-2xl font-black mt-1">
              {new Intl.NumberFormat("fr-FR").format(
                Math.round(volumeData?.montant_estime ?? 0)
              )}
            </span>
            <span className="text-[10px] opacity-40 mt-0.5">FCFA</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30 overflow-hidden animate-slide-up anim-d3">
        <div className="p-6 border-b border-base-300/30 flex justify-between items-center">
          <h3 className="text-md font-bold tracking-tight">
            Activités Récentes
          </h3>
          <button
            type="button"
            onClick={() => navigate("/enseignant/activites")}
            className="btn btn-ghost btn-sm text-primary font-bold gap-1 normal-case"
          >
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {activites.length === 0 ? (
            <p className="text-sm text-neutral text-center py-8">
              Aucune activité enregistrée
            </p>
          ) : (
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase tracking-wider text-[10px] opacity-60">
                  <th className="py-4 pl-6">Module / Cours</th>
                  <th className="py-4">Type</th>
                  <th className="py-4">Date</th>
                  <th className="py-4">Volume</th>
                  <th className="py-4 pr-6">Statut</th>
                </tr>
              </thead>
              <tbody>
                {activites.slice(0, 5).map((a) => (
                  <tr
                    key={a.id_activite}
                    className="hover:bg-base-200/30 transition-colors"
                  >
                    <td className="font-bold py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {getCoursLabel(a.id_cours).charAt(0)}
                        </div>
                        <span className="max-w-[180px] truncate">
                          {getCoursLabel(a.id_cours)}
                        </span>
                      </div>
                    </td>
                    <td className="opacity-70">
                      {getTypeLabel(a.id_typ_activite)}
                    </td>
                    <td className="opacity-60">
                      {new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                    </td>
                    <td className="font-bold">
                      {Number(a.vol_hor_cal).toFixed(2)}h
                    </td>
                    <td className="pr-6">
                      {a.statut === "approuve" ? (
                        <span className="badge bg-success/10 text-success border-none font-bold text-[10px] px-2.5 py-2 uppercase">
                          Validé
                        </span>
                      ) : (
                        <span className="badge bg-warning/10 text-warning border-none font-bold text-[10px] px-2.5 py-2 uppercase">
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}