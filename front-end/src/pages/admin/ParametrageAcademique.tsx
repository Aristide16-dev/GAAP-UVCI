import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  CalendarRange,
  CalendarDays,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Power,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../../services/admin.service";

interface YearDetails {
  id: number;
  year_label: string;
  odd_semester_start: string | null;
  odd_semester_end: string | null;
  even_semester_start: string | null;
  even_semester_end: string | null;
  is_active: boolean;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmColor,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-[scale-in_0.2s_ease-out]">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              confirmColor === "error"
                ? "bg-red-100"
                : confirmColor === "warning"
                  ? "bg-orange-100"
                  : "bg-blue-100"
            }`}
          >
            <AlertTriangle
              size={24}
              className={
                confirmColor === "error"
                  ? "text-red-600"
                  : confirmColor === "warning"
                    ? "text-orange-600"
                    : "text-blue-600"
              }
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn btn-ghost flex-1 rounded-xl normal-case"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 rounded-xl normal-case text-white border-none ${
              confirmColor === "error"
                ? "bg-red-600 hover:bg-red-700"
                : confirmColor === "warning"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParametrageAcademique() {
  const [yearsList, setYearsList] = useState<YearDetails[]>([]);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingYearId, setEditingYearId] = useState<number | null>(null);

  const [newYear, setNewYear] = useState("");
  const [newOddStart, setNewOddStart] = useState("");
  const [newOddEnd, setNewOddEnd] = useState("");
  const [newEvenStart, setNewEvenStart] = useState("");
  const [newEvenEnd, setNewEvenEnd] = useState("");

  const [editOddStart, setEditOddStart] = useState("");
  const [editOddEnd, setEditOddEnd] = useState("");
  const [editEvenStart, setEditEvenStart] = useState("");
  const [editEvenEnd, setEditEvenEnd] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "",
    onConfirm: () => {},
  });

  const loadData = async () => {
    try {
      const response = await adminService.getAcademicYears();
      setYearsList(response.data.years);
      setActiveYear(response.data.active_year);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await loadData();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateDates = (
    oddStart: string,
    oddEnd: string,
    evenStart: string,
    evenEnd: string,
  ): boolean => {
    if (!oddStart || !oddEnd || !evenStart || !evenEnd) {
      toast.error("Veuillez remplir toutes les dates");
      return false;
    }

    if (new Date(oddStart) >= new Date(oddEnd)) {
      toast.error(
        "La date de fin du semestre impair doit être après la date de début",
      );
      return false;
    }

    if (new Date(evenStart) >= new Date(evenEnd)) {
      toast.error(
        "La date de fin du semestre pair doit être après la date de début",
      );
      return false;
    }

    return true;
  };

  const handleAddYear = async () => {
    if (newYear.trim() === "") {
      toast.error("Veuillez saisir une année");
      return;
    }

    if (!validateDates(newOddStart, newOddEnd, newEvenStart, newEvenEnd)) {
      return;
    }

    if (yearsList.some((y) => y.year_label === newYear)) {
      toast.error("Cette année existe déjà");
      return;
    }

    setLoading(true);
    try {
      await adminService.createAcademicYear({
        year_label: newYear,
        odd_semester_start: newOddStart,
        odd_semester_end: newOddEnd,
        even_semester_start: newEvenStart,
        even_semester_end: newEvenEnd,
      });

      setNewYear("");
      setNewOddStart("");
      setNewOddEnd("");
      setNewEvenStart("");
      setNewEvenEnd("");
      setIsAddingYear(false);
      await loadData();
      toast.success(`Année ${newYear} créée avec succès`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateYear = (yearId: number, yearLabel: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Activer cette année",
      message: `Voulez-vous activer l'année ${yearLabel} ?\n\nCela désactivera automatiquement l'année actuellement active.`,
      confirmText: "Activer",
      confirmColor: "success",
      onConfirm: async () => {
        try {
          await adminService.activateAcademicYear(yearId);
          await loadData();
          toast.success(`Année ${yearLabel} activée`);
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors de l'activation");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleDeactivateYear = (yearId: number, yearLabel: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Désactiver cette année",
      message: `Voulez-vous désactiver l'année ${yearLabel} ?\n\nAttention : Aucune année ne sera active après cette action.`,
      confirmText: "Désactiver",
      confirmColor: "warning",
      onConfirm: async () => {
        try {
          await adminService.deactivateAcademicYear(yearId);
          await loadData();
          toast.success(`Année ${yearLabel} désactivée`);
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors de la désactivation");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleEditYear = (year: YearDetails) => {
    setEditingYearId(year.id);
    setEditOddStart(year.odd_semester_start || "");
    setEditOddEnd(year.odd_semester_end || "");
    setEditEvenStart(year.even_semester_start || "");
    setEditEvenEnd(year.even_semester_end || "");
  };

  const handleSaveEdit = async (yearId: number, yearLabel: string) => {
    if (!validateDates(editOddStart, editOddEnd, editEvenStart, editEvenEnd)) {
      return;
    }

    setLoading(true);
    try {
      await adminService.updateAcademicYear(yearId, {
        year_label: yearLabel,
        odd_semester_start: editOddStart,
        odd_semester_end: editOddEnd,
        even_semester_start: editEvenStart,
        even_semester_end: editEvenEnd,
      });

      setEditingYearId(null);
      await loadData();
      toast.success("Année modifiée avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = (
    yearId: number,
    yearLabel: string,
    isActive: boolean,
  ) => {
    if (isActive) {
      toast.error("Impossible de supprimer l'année active");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Supprimer cette année",
      message: `Voulez-vous vraiment supprimer l'année ${yearLabel} ?\n\nCette action est irréversible et supprimera toutes les données associées.`,
      confirmText: "Supprimer",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          await adminService.deleteAcademicYear(yearId);
          await loadData();
          toast.success("Année supprimée");
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors de la suppression");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Paramétrage Académique
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configurez les années académiques et les périodes de semestres.
          </p>
        </div>
        {!isAddingYear && (
          <button
            onClick={() => setIsAddingYear(true)}
            className="btn btn-sm sm:btn-md bg-primary text-white gap-2 rounded-xl normal-case hover:bg-primary/90 w-full sm:w-auto"
          >
            <Plus size={16} /> Ajouter une année
          </button>
        )}
      </div>

      {/* Année active */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4 animate-slide-up anim-d1">
        <div className="flex items-center gap-3 text-primary">
          <CalendarDays size={20} />
          <h2 className="text-base font-bold text-gray-900">Année Active</h2>
        </div>

        {activeYear ? (
          <div className="bg-linear-to-br from-primary to-purple-700 rounded-xl p-5 text-white">
            <p className="text-sm font-bold uppercase tracking-wider opacity-70 mb-1">
              Année actuellement active
            </p>
            <p className="text-2xl font-black">{activeYear}</p>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-700">Aucune année active</p>
              <p className="text-sm text-orange-600 mt-0.5">
                Veuillez activer une année académique pour commencer.
              </p>
            </div>
          </div>
        )}

        {/* Formulaire ajout */}
        {isAddingYear && (
          <div className="bg-base-200/60 rounded-xl p-4 space-y-4 border border-base-300">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Plus size={16} className="text-primary" /> Nouvelle Année Académique
            </h3>

            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Année académique *</label>
              <input
                type="text"
                placeholder="Ex: 2025 - 2026"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Semestre Impair */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
              <p className="text-sm font-black text-primary uppercase tracking-wide">Semestre Impair</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">Début</label>
                  <input type="date" value={newOddStart} onChange={(e) => setNewOddStart(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">Fin</label>
                  <input type="date" value={newOddEnd} onChange={(e) => setNewOddEnd(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            {/* Semestre Pair */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
              <p className="text-sm font-black text-purple-600 uppercase tracking-wide">Semestre Pair</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">Début</label>
                  <input type="date" value={newEvenStart} onChange={(e) => setNewEvenStart(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">Fin</label>
                  <input type="date" value={newEvenEnd} onChange={(e) => setNewEvenEnd(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAddYear} disabled={loading}
                className="btn btn-sm bg-primary text-white rounded-xl px-5 hover:bg-primary/90 gap-2 normal-case">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save size={14} />}
                Enregistrer
              </button>
              <button onClick={() => setIsAddingYear(false)} className="btn btn-sm btn-ghost rounded-xl normal-case">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des années */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up anim-d2">
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
          <CalendarRange size={20} className="text-primary shrink-0" />
          <h2 className="text-base font-bold text-gray-900">Toutes les Années Académiques</h2>
        </div>

        {yearsList.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <CalendarDays size={32} className="opacity-20 mx-auto mb-3" />
            <p className="font-medium">Aucune année académique configurée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {yearsList.map((year) => (
              <div key={year.id} className="p-4 md:p-5 hover:bg-gray-50/50 transition-colors">

                {/* Ligne principale : année + badge + actions */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-gray-900 text-base">{year.year_label}</span>
                    {year.is_active ? (
                      <span className="badge badge-success  badge-md text-white gap-1 shrink-0">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-ghost badge-md shrink-0">Inactive</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {editingYearId === year.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(year.id, year.year_label)} disabled={loading}
                          className="btn btn-sm bg-green-600 text-white border-none rounded-lg" title="Enregistrer">
                          <Save size={13} />
                        </button>
                        <button onClick={() => setEditingYearId(null)}
                          className="btn btn-sm btn-ghost rounded-lg" title="Annuler">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        {year.is_active ? (
                          <button onClick={() => handleDeactivateYear(year.id, year.year_label)}
                            className="btn btn-md bg-orange-500 text-white border-none rounded-lg" title="Désactiver">
                            <Power size={13} />
                          </button>
                        ) : (
                          <button onClick={() => handleActivateYear(year.id, year.year_label)}
                            className="btn btn-sm bg-green-600 text-white border-none rounded-lg" title="Activer">
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button onClick={() => handleEditYear(year)}
                          className="btn btn-md bg-blue-600 text-white border-none rounded-lg" title="Modifier">
                          <Edit size={13} />
                        </button>
                        {!year.is_active && (
                          <button onClick={() => handleDeleteYear(year.id, year.year_label, year.is_active)}
                            className="btn btn-sm bg-red-600 text-white border-none rounded-lg" title="Supprimer">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Semestres — en mode édition ou affichage */}
                {editingYearId === year.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div className="bg-primary/5 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-black text-primary uppercase tracking-wide">Semestre Impair</p>
                      <input type="date" value={editOddStart} onChange={(e) => setEditOddStart(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <input type="date" value={editOddEnd} onChange={(e) => setEditOddEnd(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-black text-purple-600 uppercase tracking-wide">Semestre Pair</p>
                      <input type="date" value={editEvenStart} onChange={(e) => setEditEvenStart(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <input type="date" value={editEvenEnd} onChange={(e) => setEditEvenEnd(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-primary/5 rounded-xl p-3">
                      <p className="text-[10px] font-black text-primary uppercase tracking-wide mb-1.5">Semestre Impair</p>
                      {year.odd_semester_start && year.odd_semester_end ? (
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <p>Du <span className="font-semibold">{new Date(year.odd_semester_start).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span></p>
                          <p>au <span className="font-semibold">{new Date(year.odd_semester_end).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span></p>
                        </div>
                      ) : (
                        <p className="text-sm italic text-gray-400">Non configuré</p>
                      )}
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-wide mb-1.5">Semestre Pair</p>
                      {year.even_semester_start && year.even_semester_end ? (
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <p>Du <span className="font-semibold">{new Date(year.even_semester_start).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span></p>
                          <p>au <span className="font-semibold">{new Date(year.even_semester_end).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span></p>
                        </div>
                      ) : (
                        <p className="text-sm italic text-gray-400">Non configuré</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
