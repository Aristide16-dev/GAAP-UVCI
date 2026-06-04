import React, { useState, useEffect } from "react";
import {
  Save,
  Info,
  History,
  Layers,
  Sparkles,
  Settings2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../../services/admin.service";

interface HistoryItem {
  id: number;
  date: string;
  title: string;
  user: string;
  type: string;
}

interface NiveauComplexite {
  id_niv_complex: number;
  coeff_niv_complex: number;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? "bg-red-100" : "bg-blue-100"}`}
          >
            <AlertCircle
              size={24}
              className={isDestructive ? "text-red-600" : "text-blue-600"}
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn btn-ghost flex-1 rounded-xl normal-case"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 rounded-xl normal-case text-white border-none ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParametresCalcul() {

  const initialData = { n1: "0.40", n2: "0.75", n3: "1.50", sequences: "4" };
  const [dbData, setDbData] = useState(initialData);
  const [coefficients, setCoefficients] = useState(initialData);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | "all" | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const niveauxRes = await adminService.getNiveauxComplexite();
        if (isMounted) {
          const niveaux = asArray<NiveauComplexite>(niveauxRes);
          if (niveaux.length > 0) {
            const mapped = {
              n1: niveaux[0]?.coeff_niv_complex?.toString() || "0.40",
              n2: niveaux[1]?.coeff_niv_complex?.toString() || "0.75",
              n3: niveaux[2]?.coeff_niv_complex?.toString() || "1.50",
              sequences: "4",
            };
            setDbData(mapped);
            setCoefficients(mapped);
          }
        }
        adminService.getNiveauxComplexiteHistory()
          .then((historyRes) => {
            if (isMounted) setHistory(asArray<HistoryItem>(historyRes));
          })
          .catch(() => {
            if (isMounted) setHistory([]);
          });
      } catch {
        if (isMounted) toast.error("Erreur lors du chargement");
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    ["n1", "n2", "n3"].forEach((field) => {
      const val = coefficients[field as keyof typeof coefficients];
      if (!val || isNaN(Number(val)) || Number(val) < 0)
        newErrors[field] = "Valeur requise";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoefficients((prev) => ({ ...prev, [name]: value }));
    if (errors[name])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
  };

  const handleSaveClick = () => {
    if (!validate()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const response = await adminService.getNiveauxComplexite();
      const niveaux = asArray<NiveauComplexite>(response);
      if (niveaux.length < 3) {
        toast.error("Données de niveaux manquantes");
        return;
      }

      const updates: Promise<unknown>[] = [];
      if (coefficients.n1 !== dbData.n1)
        updates.push(
          adminService.updateNiveauComplexite(niveaux[0].id_niv_complex, {
            coeff_niv_complex: parseFloat(coefficients.n1),
          }),
        );
      if (coefficients.n2 !== dbData.n2)
        updates.push(
          adminService.updateNiveauComplexite(niveaux[1].id_niv_complex, {
            coeff_niv_complex: parseFloat(coefficients.n2),
          }),
        );
      if (coefficients.n3 !== dbData.n3)
        updates.push(
          adminService.updateNiveauComplexite(niveaux[2].id_niv_complex, {
            coeff_niv_complex: parseFloat(coefficients.n3),
          }),
        );

      if (updates.length === 0) {
        toast.info("Aucune modification détectée");
        return;
      }

      await Promise.all(updates);
      const historyRes = await adminService.getNiveauxComplexiteHistory();
      if (historyRes.data) setHistory(historyRes.data);
      setDbData(coefficients);
      toast.success("Paramètres enregistrés avec succès");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCoefficients(dbData);
    setErrors({});
    toast.info("Modifications annulées");
  };

  const requestDelete = (target: number | "all") => {
    setDeleteTarget(target);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      if (deleteTarget === "all") {
        await adminService.clearNiveauxComplexiteHistory();
        setHistory([]);
        toast.success("Historique vidé");
      } else if (typeof deleteTarget === "number") {
        await adminService.deleteNiveauxComplexiteHistory(deleteTarget);
        setHistory((prev) => prev.filter((h) => h.id !== deleteTarget));
        toast.success("Entrée supprimée");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-w-0">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Paramètres de Calcul
            </h1>
            <p className="text-gray-500 font-medium mt-1 text-sm leading-relaxed">
              Définissez les coefficients utilisés pour le calcul des charges d'enseignement.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCancel}
              className="btn btn-ghost text-gray-500 font-bold h-11 px-5 rounded-xl normal-case"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveClick}
              disabled={loading}
              className="btn bg-[#00965E] hover:bg-[#007D4E] border-none text-white px-5 h-11 rounded-xl gap-2 shadow-lg shadow-green-100 normal-case font-bold flex-1 sm:flex-none"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} />}
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6 min-w-0 animate-slide-up anim-d1">
            <div className="bg-white rounded-xl p-6 md:p-10 border border-gray-100 shadow-sm space-y-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-purple-50 rounded-xl text-primary">
                  <Layers size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Coefficients de Conception
                  </h2>
                  <p className="text-sm font-black text-gray-400 tracking-[0.2em] uppercase mt-1">
                    Ajustement par niveau de complexité
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "n1",
                    label: "NIVEAU 1",
                    sub: "Coeff. de base",
                    desc: "Basé sur 50% du coefficient de conception initiale.",
                  },
                  {
                    id: "n2",
                    label: "NIVEAU 2",
                    sub: "Coeff. intermédiaire",
                    desc: "Calcul automatisé à 50% du temps de création.",
                  },
                  {
                    id: "n3",
                    label: "NIVEAU 3",
                    sub: "Coeff. expert",
                    desc: "Maintenance de cours à haute intensité technologique.",
                  },
                ].map((item) => {
                  const val = parseFloat(
                    coefficients[item.id as keyof typeof coefficients] || "0",
                  );
                  const updateVal = (val * 0.5).toFixed(2);
                  const hasError = !!errors[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`bg-[#FFF5F9] rounded-xl p-6 flex flex-col gap-5 border transition-all hover:shadow-md ${hasError ? "border-red-300" : "border-pink-50"}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-pink-600 tracking-[0.2em] uppercase">
                          {item.label}
                        </span>
                        <Info size={18} className="text-pink-300 cursor-help" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-400">
                          {item.sub}
                        </p>
                        <input
                          type="text"
                          name={item.id}
                          value={
                            coefficients[item.id as keyof typeof coefficients]
                          }
                          onChange={handleInputChange}
                          className="w-full bg-white rounded-xl h-16 text-2xl font-black text-center text-gray-800 border-none shadow-sm focus:ring-4 focus:ring-pink-100 outline-none transition-all"
                        />
                        {hasError && (
                          <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                            <AlertCircle size={12} /> {errors[item.id]}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-pink-100/50">
                        <p className="text-[10px] font-semibold uppercase mb-1">
                          {item.label} Mise à jour ={" "}
                          <span
                            key={updateVal}
                            className="text-purple-600 text-xl font-bold"
                            style={{ animation: 'pulse 0.3s ease-out' }}
                          >
                            {updateVal}h
                          </span>
                        </p>
                        <p className="text-[10px] leading-relaxed text-gray-400 font-bold uppercase tracking-tight">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start gap-8">
              <div className="p-5 bg-purple-50 rounded-xl text-purple-600 shrink-0">
                <Sparkles size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Règle de Mise à Jour Automatique
                </h3>
                <p className="text-gray-500 text-lg font-medium leading-relaxed">
                  Conformément à la politique académique de l'UVCI, le système
                  applique un ratio fixe de{" "}
                  <span className="text-pink-600 font-black">50%</span> pour les
                  heures de mise à jour par rapport aux heures de conception.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 min-w-0 animate-slide-up anim-d2">
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <History size={20} className="text-gray-400 shrink-0" />
                  <h3 className="text-base font-bold text-gray-800">
                    Dernières Modifications
                  </h3>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={() => requestDelete("all")}
                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 normal-case font-bold gap-1 shrink-0"
                  >
                    <Trash2 size={13} /> Vider
                  </button>
                )}
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.length > 0 ? (
                  history.map((log) => (
                    <div
                      key={log.id}
                      className={`relative border-l-4 ${log.type === "user" ? "border-green-500" : "border-gray-200"} pl-6 py-2 group hover:bg-gray-50 rounded-r-lg transition-colors`}
                    >
                      <button
                        onClick={() => requestDelete(log.id)}
                        className="absolute right-2 top-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="space-y-1.5 pr-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {log.date}
                        </p>
                        <p className="font-bold text-gray-900 text-[15px] leading-tight">
                          {log.title}
                        </p>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-tight">
                          Par: {log.user || "—"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <History size={20} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium">
                      Aucun historique récent
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-5">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <Settings2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  Séquence pédagogique
                </h3>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 space-y-3 border border-purple-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-purple-700">4</span>
                  <span className="text-lg font-bold text-purple-500">
                    séquences = 1 heure
                  </span>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-purple-100">
                  <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirmer les modifications"
        message="Voulez-vous vraiment enregistrer ces nouveaux paramètres de calcul ? Cela impactera tous les futurs calculs académiques."
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title={
          deleteTarget === "all" ? "Vider l'historique" : "Supprimer l'entrée"
        }
        message={
          deleteTarget === "all"
            ? "Êtes-vous sûr de vouloir vider l'intégralité de l'historique ? Cette action est irréversible."
            : "Êtes-vous sûr de vouloir supprimer cette entrée de l'historique ?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        isDestructive
      />
    </div>
  );
}
