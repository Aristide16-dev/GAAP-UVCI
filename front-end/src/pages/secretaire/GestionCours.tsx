import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, Save, Pencil, Trash2, AlertTriangle, X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { niveauService, type Niveau } from "../../services/Niveau.service";
import { coursService, type Cours } from "../../services/cours.service";
import api from "../../api/axios";

interface CoursFormData {
  int_cours: string;
  filiere: string;
  id_niveau: number;
  semestre: string;
  nb_credits: number;
  nb_heures: number;
  id_typ_res: number | null;
}

interface TypeRessource {
  id_typ_res: number;
  typ_res: string;
  id_niv_complex: number | null;
  lib_niv_complex: string | null;
  coeff_niv_complex: number | null;
}

const SEQUENCES_PAR_HEURE = 4;

const EMPTY_FORM: CoursFormData = {
  int_cours: "", filiere: "", id_niveau: 0, semestre: "S1", nb_credits: 4, nb_heures: 20, id_typ_res: null,
};

const NIVEAU_COLORS: Record<number, { bg: string; text: string; border: string; dot: string }> = {
  1: { bg: "bg-success/10", text: "text-success", border: "border-success/30", dot: "bg-success" },
  2: { bg: "bg-info/10", text: "text-info", border: "border-info/30", dot: "bg-info" },
  3: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/30", dot: "bg-secondary" },
};

function getNiveauColor(niv: number | null | undefined) {
  return NIVEAU_COLORS[niv ?? 0] ?? { bg: "bg-base-200", text: "text-neutral", border: "border-base-300", dot: "bg-neutral" };
}

function toValidId(value: unknown): number {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export default function GestionCours() {
  const [formData, setFormData] = useState<CoursFormData>(EMPTY_FORM);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [coursList, setCoursList] = useState<Cours[]>([]);
  const [typesRessources, setTypesRessources] = useState<TypeRessource[]>([]);
  const [selectedNiveauId, setSelectedNiveauId] = useState<number>(0);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; cours: Cours | null }>({ open: false, cours: null });
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const nbSequences = formData.nb_heures * SEQUENCES_PAR_HEURE;
  const progressValue = Math.min((formData.nb_heures / 120) * 100, 100);
  const validNiveaux = useMemo(
    () => niveaux.filter((n) => toValidId(n.id_niveau)),
    [niveaux],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [niveauxData, coursData, typResData] = await Promise.all([
        niveauService.getAll(),
        coursService.getAll(),
        api.get("/types-ressources").then((r) => r.data.data ?? []),
      ]);
      setNiveaux(niveauxData);
      setCoursList(coursData);
      setTypesRessources(typResData);
      if (niveauxData.length > 0) {
        const firstId = toValidId(niveauxData[0].id_niveau);
        setSelectedNiveauId(firstId);
        setFormData((prev) => ({ ...prev, id_niveau: firstId }));
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (toValidId(formData.id_niveau) || validNiveaux.length === 0) return;

    const firstId = toValidId(validNiveaux[0].id_niveau);
    setSelectedNiveauId(firstId);
    setFormData((prev) => ({ ...prev, id_niveau: firstId }));
  }, [formData.id_niveau, validNiveaux]);

  const selectNiveau = (niveauId: number) => {
    if (!niveauId) return;
    setSelectedNiveauId(niveauId);
    setFormData((prev) => ({ ...prev, id_niveau: niveauId }));
  };

  const openNewForm = () => {
    const firstId = niveaux[0] ? toValidId(niveaux[0].id_niveau) : 0;
    setEditingCourseId(null);
    setSelectedNiveauId(firstId);
    setFormData({ ...EMPTY_FORM, id_niveau: firstId });
    setShowForm(true);
  };

  const openEditForm = (cours: Cours) => {
    setEditingCourseId(cours.id_cours);
    const niveauId = toValidId(cours.id_niveau);
    setSelectedNiveauId(niveauId);
    setFormData({
      int_cours: cours.int_cours,
      filiere: cours.filiere,
      id_niveau: niveauId,
      semestre: cours.semestre,
      nb_credits: cours.nb_credits,
      nb_heures: cours.nb_heures,
      id_typ_res: cours.id_typ_res ?? null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCourseId(null);
    const firstId = niveaux[0] ? toValidId(niveaux[0].id_niveau) : 0;
    setSelectedNiveauId(firstId);
    setFormData({ ...EMPTY_FORM, id_niveau: firstId });
  };

  const submitForm = async () => {
    const niveauId =
      toValidId(formData.id_niveau) ||
      toValidId(selectedNiveauId) ||
      toValidId(validNiveaux[0]?.id_niveau);
    if (!formData.int_cours.trim()) { toast.error("Veuillez saisir l'intitulé du cours"); return; }
    if (!formData.filiere.trim()) { toast.error("Veuillez saisir la filière"); return; }
    if (!niveauId) { toast.error("Veuillez sélectionner un niveau"); return; }
    const payload = { ...formData, id_niveau: niveauId };
    try {
      setSaving(true);
      if (editingCourseId) {
        await coursService.update(editingCourseId, payload);
        toast.success("Cours modifié avec succès");
      } else {
        await coursService.create(payload);
        toast.success("Cours enregistré avec succès");
      }
      const updated = await coursService.getAll();
      setCoursList(updated);
      closeForm();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error?.response?.data?.message ?? error?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const handleDelete = async () => {
    if (!deleteModal.cours) return;
    setDeleting(true);
    try {
      await coursService.delete(deleteModal.cours.id_cours);
      toast.success("Cours supprimé");
      const updated = await coursService.getAll();
      setCoursList(updated);
      setDeleteModal({ open: false, cours: null });
      if (editingCourseId === deleteModal.cours.id_cours) closeForm();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const getNiveauLabel = (id: number) =>
    niveaux.find((n) => Number(n.id_niveau) === id)?.lib_niveau ?? "—";

  const getTypeRessource = (idTypRes: number | null | undefined): TypeRessource | undefined =>
    typesRessources.find((t) => t.id_typ_res === idTypRes);

  const selectedType = getTypeRessource(formData.id_typ_res);

  return (
    <div className="min-h-screen p-3">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
          <div>
            <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">Portail Académique</p>
            <h1 className="text-3xl sm:text-4xl font-black text-base-content mt-2">Maquette Pédagogique</h1>
            <p className="text-neutral mt-2 text-sm">Définissez et gérez les structures de cours académiques.</p>
          </div>
          {!showForm && (
            <button onClick={openNewForm} className="btn btn-primary rounded-xl normal-case font-black gap-2 shadow-lg">
              <Plus size={18} /> Nouveau cours
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-xl text-sm font-black uppercase tracking-wider border ${
                  editingCourseId ? "bg-warning/10 text-warning border-warning/20" : "bg-primary/10 text-primary border-primary/20"
                }`}>
                  {editingCourseId ? "Modification du cours" : "Nouveau cours"}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeForm} className="btn btn-ghost rounded-xl normal-case font-bold gap-2">
                  <X size={16} /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary rounded-xl normal-case font-black gap-2 shadow-lg border-none"
                >
                  {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} />}
                  {saving ? "Enregistrement..." : (editingCourseId ? "Enregistrer les modifications" : "Créer le cours")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-8 bg-base-100 rounded-4xl border border-base-300 shadow-sm p-5 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-lg font-black text-base-content">Configuration du Cours</h2>
                </div>

                <div className="space-y-6">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Intitulé du Cours</span></label>
                    <input type="text" value={formData.int_cours}
                      onChange={(e) => setFormData((p) => ({ ...p, int_cours: e.target.value }))}
                      placeholder="Ex: Algorithmique Avancée et Structures de Données"
                      className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Filière</span></label>
                    <input type="text" value={formData.filiere}
                      onChange={(e) => setFormData((p) => ({ ...p, filiere: e.target.value }))}
                      placeholder="Ex: Informatique et Sciences du Numérique"
                      className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Niveau</span></label>
                      <div className="space-y-3">
                        <select
                          value={toValidId(formData.id_niveau) || toValidId(selectedNiveauId)}
                          onChange={(e) => selectNiveau(toValidId(e.target.value))}
                          className="select select-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={validNiveaux.length === 0}
                          required
                        >
                          {validNiveaux.length === 0 ? (
                            <option value={0}>Aucun niveau disponible</option>
                          ) : (
                            validNiveaux.map((n) => {
                              const nId = toValidId(n.id_niveau);
                              return <option key={nId} value={nId}>{n.lib_niveau}</option>;
                            })
                          )}
                        </select>

                        {validNiveaux.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {validNiveaux.map((n) => {
                              const nId = toValidId(n.id_niveau);
                              if (!nId) return null;
                              return (
                                <button key={nId} type="button"
                                  onClick={() => selectNiveau(nId)}
                                  className={`btn rounded-xl min-w-13 border-none font-black transition-all ${
                                    (toValidId(formData.id_niveau) || selectedNiveauId) === nId ? "btn-primary text-white" : "bg-base-300 text-neutral hover:bg-base-200"
                                  }`}>
                                  {n.lib_niveau}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-warning font-bold">
                            Aucun niveau d'étude n'est configuré dans la base.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Semestre</span></label>
                      <div className="flex gap-3">
                        {["S1", "S2"].map((s) => (
                          <button key={s} type="button"
                            onClick={() => setFormData((p) => ({ ...p, semestre: s }))}
                            className={`btn rounded-xl border-none flex-1 font-black transition-all ${
                              formData.semestre === s ? "btn-primary" : "bg-base-300 hover:bg-base-300 text-base-content"
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Nombre de Crédits</span></label>
                      <div className="relative">
                        <input type="number" value={formData.nb_credits}
                          onChange={(e) => setFormData((p) => ({ ...p, nb_credits: Number(e.target.value) }))}
                          min={1} max={30}
                          className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 pr-20" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black tracking-widest text-neutral">Cr</span>
                      </div>
                    </div>

                    <div>
                      <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Volume Horaire</span></label>
                      <div className="relative">
                        <input type="number" value={formData.nb_heures}
                          onChange={(e) => setFormData((p) => ({ ...p, nb_heures: Math.max(1, Number(e.target.value)) }))}
                          min={1} placeholder="Ex: 40"
                          className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-black text-primary pr-12" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black tracking-widest text-neutral">H</span>
                      </div>
                    </div>
                  </div>

                  {/* Type de ressource */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Type de Ressource</span>
                      <span className="label-text-alt text-sm text-neutral opacity-60">optionnel</span>
                    </label>
                    {typesRessources.length === 0 ? (
                      <p className="text-sm text-neutral italic">Aucun type de ressource configuré — demandez à l'administrateur.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, id_typ_res: null }))}
                          className={`btn rounded-xl border-none font-bold text-sm transition-all ${
                            formData.id_typ_res === null ? "btn-neutral text-white" : "bg-base-300 text-neutral hover:bg-base-200"
                          }`}
                        >
                          Aucun
                        </button>
                        {typesRessources.map((t) => {
                          const col = getNiveauColor(t.id_niv_complex);
                          const isSelected = formData.id_typ_res === t.id_typ_res;
                          return (
                            <button
                              key={t.id_typ_res}
                              type="button"
                              onClick={() => setFormData((p) => ({ ...p, id_typ_res: t.id_typ_res }))}
                              className={`btn rounded-xl border font-bold text-sm transition-all gap-2 ${
                                isSelected
                                  ? `${col.bg} ${col.text} ${col.border}`
                                  : "bg-base-300 border-base-300 text-neutral hover:bg-base-200"
                              }`}
                            >
                              {t.lib_niv_complex && (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                              )}
                              {t.typ_res}
                              {t.lib_niv_complex && (
                                <span className={`text-[10px] font-black opacity-70`}>{t.lib_niv_complex}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedType?.lib_niv_complex && (
                      <p className="text-[11px] text-neutral italic mt-1.5">
                        Niveau <strong>{selectedType.lib_niv_complex}</strong> — coefficient ×{selectedType.coeff_niv_complex} appliqué au calcul du VH.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary panel */}
              <div className="xl:col-span-4 space-y-5">
                <div className="bg-base-100 rounded-4xl border border-base-300 shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-black text-base-content">Séquences Générées</h2>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-widest font-black text-neutral">Total séquences</p>
                      <p className="text-sm text-neutral mt-1">{formData.nb_heures}h × {SEQUENCES_PAR_HEURE}</p>
                    </div>
                    <h3 className="text-5xl font-black text-primary">{nbSequences}</h3>
                  </div>
                  <progress className="progress progress-primary w-full h-3 mt-6" value={progressValue} max="100"></progress>
                  <p className="text-sm text-neutral leading-relaxed mt-3">
                    Règle UVCI : {SEQUENCES_PAR_HEURE} séquences par heure.
                  </p>
                  <div className="divider my-4"></div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-neutral">Heures</span><span className="font-black">{formData.nb_heures} h</span></div>
                    <div className="flex justify-between"><span className="text-neutral">Crédits Cr</span><span className="font-black">{formData.nb_credits}</span></div>
                    <div className="flex justify-between"><span className="text-neutral">Semestre</span><span className="font-black text-primary">{formData.semestre}</span></div>
                    <div className="flex justify-between"><span className="text-neutral">Niveau</span><span className="font-black">{getNiveauLabel(selectedNiveauId)}</span></div>
                    {selectedType && (
                      <>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-neutral text-sm">Type</span>
                          <span className={`text-sm font-black ${getNiveauColor(selectedType.id_niv_complex).text}`}>{selectedType.typ_res}</span>
                        </div>
                        {selectedType.lib_niv_complex && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral text-sm">Complexité</span>
                            <span className={`badge badge-sm font-bold border ${getNiveauColor(selectedType.id_niv_complex).bg} ${getNiveauColor(selectedType.id_niv_complex).text} ${getNiveauColor(selectedType.id_niv_complex).border}`}>
                              {selectedType.lib_niv_complex}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="divider my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral font-black text-sm uppercase tracking-wider">Séquences totales</span>
                      <span className="font-black text-primary text-2xl">{nbSequences}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Courses list */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-base-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <h2 className="font-black text-base-content">Catalogue des cours</h2>
            <span className="badge badge-ghost badge-sm font-bold ml-auto">{coursList.length}</span>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/50 text-[11px] uppercase tracking-wider">
                    <th>Intitulé</th><th>Filière</th><th className="text-center">Niveau</th><th className="text-center">Semestre</th><th className="text-center">Crédits</th><th className="text-center">Heures</th><th className="text-center">Type ressource</th><th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-base-200/50">
                      <td><div className="skeleton h-3 w-36"></div></td>
                      <td><div className="skeleton h-3 w-28"></div></td>
                      <td className="text-center"><div className="skeleton h-5 w-12 rounded-full mx-auto"></div></td>
                      <td className="text-center"><div className="skeleton h-5 w-8 rounded-full mx-auto"></div></td>
                      <td className="text-center"><div className="skeleton h-3 w-12 mx-auto"></div></td>
                      <td className="text-center"><div className="skeleton h-3 w-10 mx-auto"></div></td>
                      <td className="text-center"><div className="skeleton h-5 w-20 rounded-full mx-auto"></div></td>
                      <td><div className="flex justify-center gap-2"><div className="skeleton h-6 w-16 rounded-xl"></div><div className="skeleton h-6 w-16 rounded-xl"></div></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : coursList.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-xl bg-base-200 flex items-center justify-center">
                <BookOpen size={28} className="text-neutral" />
              </div>
              <p className="font-black text-base-content">Aucun cours enregistré</p>
              <button onClick={openNewForm} className="btn btn-primary btn-sm rounded-xl normal-case font-bold gap-1 mt-2">
                <Plus size={14} /> Créer le premier cours
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/50 text-[11px] uppercase tracking-wider">
                    <th>Intitulé</th>
                    <th>Filière</th>
                    <th className="text-center">Niveau</th>
                    <th className="text-center">Semestre</th>
                    <th className="text-center">Crédits</th>
                    <th className="text-center">Heures</th>
                    <th className="text-center">Type ressource</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursList.map((c) => {
                    const typeRes = getTypeRessource(c.id_typ_res);
                    const col = getNiveauColor(typeRes?.id_niv_complex);
                    return (
                      <tr
                        key={c.id_cours}
                        className={`border-b border-base-200/50 hover:bg-base-200/30 transition-colors ${
                          editingCourseId === c.id_cours ? "bg-warning/5 border-l-4 border-warning" : ""
                        }`}
                      >
                        <td className="font-bold text-base-content max-w-[180px]">
                          <p className="truncate">{c.int_cours}</p>
                        </td>
                        <td className="text-sm text-neutral max-w-[130px]">
                          <p className="truncate">{c.filiere}</p>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-ghost badge-sm font-bold">{getNiveauLabel(Number(c.id_niveau))}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-sm font-bold border-none ${c.semestre === "S1" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                            {c.semestre}
                          </span>
                        </td>
                        <td className="text-center font-bold">{c.nb_credits} Cr</td>
                        <td className="text-center font-bold text-primary">{c.nb_heures} h</td>
                        <td className="text-center">
                          {typeRes ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-sm font-bold border ${col.bg} ${col.text} ${col.border}`}>
                              {typeRes.lib_niv_complex && <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />}
                              {typeRes.typ_res}
                            </span>
                          ) : (
                            <span className="text-sm text-neutral opacity-40">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(c)}
                              className="btn btn-ghost btn-sm gap-1 text-primary hover:bg-primary/10 rounded-xl normal-case font-bold"
                            >
                              <Pencil size={13} /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ open: true, cours: c })}
                              className="btn btn-ghost btn-sm gap-1 text-error hover:bg-error/10 rounded-xl normal-case font-bold"
                            >
                              <Trash2 size={13} /> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteModal.open && deleteModal.cours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-base-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base-content text-lg">Supprimer le cours ?</h3>
                <p className="text-sm text-neutral mt-1">
                  <span className="font-bold text-base-content">"{deleteModal.cours.int_cours}"</span>{" "}
                  sera définitivement supprimé. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, cours: null })}
                className="btn btn-ghost rounded-xl flex-1 normal-case font-bold"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-error rounded-xl flex-1 normal-case font-black gap-2 text-white border-none"
              >
                <Trash2 size={16} />
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
