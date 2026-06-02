import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save, Search, ShieldCheck, UserPlus, Lock,
  ChevronRight, CheckCircle2, X, Pencil, Trash2,
  AlertTriangle, Link2, Users,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  enseignantService,
  type CreateEnseignantData,
  type Enseignant,
} from "../../services/enseignant.service";
import { gradeService, type Grade } from "../../services/grade.service";
import { statutService, type Statut } from "../../services/statut.service";
import { departementService, type Departement } from "../../services/departement.service";
import { adminService, type User as AdminUser } from "../../services/admin.service";

const EMPTY_FORM: CreateEnseignantData = {
  nom_ens: "", pren_ens: "", email_ens: "", tel_ens: "",
  id_grade: 0, id_statut: 0, id_depart: 0, taux_hor_ens: 0,
  user_log_ens: "", user_pasw_ens: "Uvci@2024",
};

export default function EnseignantsList() {
  const [formData, setFormData] = useState<CreateEnseignantData>(EMPTY_FORM);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [allEnseignants, setAllEnseignants] = useState<Enseignant[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<AdminUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Enseignant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [departementQuery, setDepartementQuery] = useState("");
  const [departementSuggestions, setDepartementSuggestions] = useState<Departement[]>([]);
  const [showDepartementSuggestions, setShowDepartementSuggestions] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; teacher: Enseignant | null }>({ open: false, teacher: null });
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const departementRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gradesData, statutsData, departementsData, enseignantsData, usersData] = await Promise.all([
        gradeService.getAll(),
        statutService.getAll(),
        departementService.getAll(),
        enseignantService.getAll(),
        adminService.getUsers().catch(() => ({ data: [] as AdminUser[], success: true })),
      ]);
      setGrades(gradesData);
      setStatuts(statutsData);
      setDepartements(departementsData);
      setAllEnseignants(enseignantsData);
      const accounts = (usersData.data ?? []).filter((u) => u.role === "enseignant");
      setTeacherAccounts(accounts);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
      if (departementRef.current && !departementRef.current.contains(e.target as Node))
        setShowDepartementSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveTaux = (libStatut: string, grade: Grade | undefined): number => {
    if (!grade) return 0;
    return libStatut.toLowerCase().includes("vacataire")
      ? (grade.taux_hor_vacataire ?? 0)
      : (grade.taux_hor_permanent ?? 0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const q = value.toLowerCase();
    const results = allEnseignants
      .filter((e) =>
        e.nom_ens.toLowerCase().includes(q) ||
        e.pren_ens.toLowerCase().includes(q) ||
        e.email_ens.toLowerCase().includes(q),
      )
      .slice(0, 6);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  };

  const handleDepartementChange = (value: string) => {
    setDepartementQuery(value);
    if (!value) { setFormData((p) => ({ ...p, id_depart: 0 })); setShowDepartementSuggestions(false); return; }
    const q = value.toLowerCase();
    const results = departements.filter((d) => d.lib_depart.toLowerCase().includes(q)).slice(0, 5);
    setDepartementSuggestions(results);
    setShowDepartementSuggestions(results.length > 0);
  };

  const handleSelectDepartement = (d: Departement) => {
    setFormData((p) => ({ ...p, id_depart: d.id_depart }));
    setDepartementQuery(d.lib_depart);
    setShowDepartementSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "id_grade" || name === "id_statut") {
        const grade = grades.find((g) => g.id_grade === Number(updated.id_grade));
        const statut = statuts.find((s) => s.id_statut === Number(updated.id_statut));
        updated.taux_hor_ens = resolveTaux(statut?.lib_statut ?? "", grade);
      }
      return updated;
    });
  };

  const openNewForm = () => {
    setIsCreating(true);
    setShowForm(true);
    setSelectedEnseignant(null);
    setLinkedAccount(null);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setDepartementQuery("");
    setFormData({ ...EMPTY_FORM });
  };

  const handleSelectEnseignant = (enseignant: Enseignant) => {
    const depart = departements.find((d) => d.id_depart === enseignant.id_depart);
    const grade = grades.find((g) => g.id_grade === enseignant.id_grade);
    const statut = statuts.find((s) => s.id_statut === enseignant.id_statut);
    const correctTaux = resolveTaux(statut?.lib_statut ?? "", grade);
    setSelectedEnseignant(enseignant);
    setIsCreating(false);
    setShowForm(true);
    setLinkedAccount(null);
    setFormData({
      nom_ens: enseignant.nom_ens,
      pren_ens: enseignant.pren_ens,
      email_ens: enseignant.email_ens,
      tel_ens: enseignant.tel_ens,
      id_grade: enseignant.id_grade,
      id_statut: enseignant.id_statut,
      id_depart: enseignant.id_depart,
      taux_hor_ens: correctTaux,
      user_log_ens: enseignant.user_log_ens,
      user_pasw_ens: "",
    });
    setSearchQuery(`${enseignant.nom_ens} ${enseignant.pren_ens}`);
    setDepartementQuery(depart?.lib_depart ?? "");
    setShowSuggestions(false);
  };

  const handleLinkAccount = (account: AdminUser) => {
    setLinkedAccount(account);
    const words = (account.nom ?? "").trim().split(/\s+/);
    const nom = words.length > 1 ? words[words.length - 1] : (words[0] ?? "");
    const pren = words.length > 1 ? words.slice(0, -1).join(" ") : "";
    setFormData((p) => ({
      ...p,
      user_log_ens: account.login ?? account.email,
      nom_ens: nom,
      pren_ens: pren,
      email_ens: account.email ?? "",
    }));
  };

  const handleClose = () => {
    setShowForm(false);
    setIsCreating(false);
    setSelectedEnseignant(null);
    setLinkedAccount(null);
    setSearchQuery("");
    setSuggestions([]);
    setDepartementQuery("");
    setFormData({ ...EMPTY_FORM });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_depart) { toast.error("Veuillez sélectionner un département"); return; }
    if (!formData.id_statut) { toast.error("Veuillez sélectionner un statut contractuel"); return; }
    if (isCreating && !formData.user_log_ens?.trim()) { toast.error("Veuillez saisir un identifiant de connexion"); return; }
    try {
      setSaving(true);
      if (selectedEnseignant) {
        const { user_pasw_ens: _pwd, user_log_ens: _login, ...updateData } = formData;
        await enseignantService.update(selectedEnseignant.id_ens, updateData);
        toast.success("Enseignant mis à jour avec succès");
      } else {
        await enseignantService.create(formData);
        toast.success("Enseignant enregistré avec succès");
      }
      const updated = await enseignantService.getAll();
      setAllEnseignants(updated);
      handleClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error?.response?.data?.message ?? error?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteModal.teacher) return;
    setDeleting(true);
    try {
      await enseignantService.delete(deleteModal.teacher.id_ens);
      toast.success("Enseignant supprimé");
      const updated = await enseignantService.getAll();
      setAllEnseignants(updated);
      setDeleteModal({ open: false, teacher: null });
      if (selectedEnseignant?.id_ens === deleteModal.teacher.id_ens) handleClose();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const selectedGrade = grades.find((g) => g.id_grade === Number(formData.id_grade));
  const selectedStatut = statuts.find((s) => s.id_statut === Number(formData.id_statut));

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
          <div>
            <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">Portail Académique</p>
            <h1 className="text-3xl sm:text-4xl font-black text-base-content mt-1">
              Enregistrement <span className="text-primary">Enseignants</span>
            </h1>
            <p className="text-neutral mt-2 text-sm">{allEnseignants.length} enseignant(s) enregistré(s)</p>
          </div>
          <button
            onClick={openNewForm}
            className="btn btn-primary rounded-xl normal-case font-black gap-2 shadow-lg"
          >
            <UserPlus size={18} /> Nouvel enseignant
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-5 animate-slide-up anim-d1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Search size={16} />
            </div>
            <div>
              <p className="font-black text-sm text-base-content">Modifier un enseignant existant</p>
              <p className="text-sm text-neutral">Tapez le nom, prénom ou email</p>
            </div>
          </div>
          <div ref={searchRef} className="relative">
            <div className="flex gap-3 items-center bg-base-200 rounded-xl px-4 py-1">
              <Search size={16} className="text-neutral shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Ex: Kouamé Koffi ou kouame@uvci.edu.ci"
                className="input bg-transparent border-none focus:outline-none w-full text-sm text-base-content placeholder:text-neutral/60"
              />
              {searchQuery && (
                <button type="button" onClick={handleClose} className="text-neutral hover:text-error transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-30 w-full mt-2 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2">
                  <p className="text-[10px] uppercase font-black tracking-widest text-neutral px-3 py-1">
                    {suggestions.length} résultat(s)
                  </p>
                  {suggestions.map((e) => {
                    const grade = grades.find((g) => g.id_grade === e.id_grade);
                    return (
                      <div
                        key={e.id_ens}
                        onMouseDown={() => handleSelectEnseignant(e)}
                        className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-primary/5 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                            {e.nom_ens.charAt(0)}{e.pren_ens.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{e.nom_ens} {e.pren_ens}</p>
                            <p className="text-sm text-neutral">{e.email_ens}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {grade && <span className="badge badge-sm badge-ghost">{grade.lib_grade}</span>}
                          <ChevronRight size={14} className="text-neutral group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Status banner */}
            <div className={`rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
              isCreating ? "bg-primary/5 border-primary/20" : "bg-warning/10 border-warning/30"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isCreating ? "bg-primary/10 text-primary" : "bg-warning/20 text-warning"
                }`}>
                  {isCreating ? <UserPlus size={22} /> : <Pencil size={22} />}
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-widest font-black ${isCreating ? "text-primary" : "text-warning"}`}>
                    {isCreating ? "Création d'un nouvel enseignant" : "Modification en cours"}
                  </p>
                  <h3 className="font-black text-base-content text-lg mt-0.5">
                    {isCreating ? "Nouveau profil" : `${formData.nom_ens} ${formData.pren_ens}`}
                  </h3>
                  {!isCreating && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="badge badge-sm badge-ghost">{selectedGrade?.lib_grade ?? "—"}</span>
                      <span className="badge badge-sm badge-ghost">{selectedStatut?.lib_statut ?? "—"}</span>
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={handleClose} className="btn btn-ghost btn-sm rounded-xl normal-case text-neutral">
                <X size={16} /> Annuler
              </button>
            </div>

            {/* Account link (create mode only) */}
            {isCreating && teacherAccounts.length > 0 && (
              <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-base-content">Lier à un compte système existant</p>
                    <p className="text-sm text-neutral">Compte créé par l'administrateur (optionnel)</p>
                  </div>
                </div>
                <select
                  className="select select-bordered bg-white border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium text-sm"
                  value={linkedAccount?.id ?? ""}
                  onChange={(e) => {
                    if (!e.target.value) { setLinkedAccount(null); setFormData((p) => ({ ...p, user_log_ens: "" })); return; }
                    const acc = teacherAccounts.find((u) => String(u.id) === e.target.value);
                    if (acc) handleLinkAccount(acc);
                  }}
                >
                  <option value="">-- Aucun compte lié (saisie manuelle) --</option>
                  {teacherAccounts.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom} — {u.email} {u.login ? `(login: ${u.login})` : ""}
                    </option>
                  ))}
                </select>
                {linkedAccount && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-success font-bold">
                    <CheckCircle2 size={13} />
                    Login pré-rempli : <span className="font-black">{linkedAccount.login ?? linkedAccount.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Personal info */}
            <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="font-black text-sm text-base-content">Informations personnelles & académiques</p>
                  <p className="text-sm text-neutral">Renseignez tous les champs requis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Nom</span></label>
                  <input type="text" name="nom_ens" value={formData.nom_ens} onChange={handleInputChange}
                    className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                </div>

                {/* Prénom */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Prénom(s)</span></label>
                  <input type="text" name="pren_ens" value={formData.pren_ens} onChange={handleInputChange}
                    className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                </div>

                {/* Email */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Email</span></label>
                  <input type="email" name="email_ens" value={formData.email_ens} onChange={handleInputChange}
                    className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                </div>

                {/* Téléphone */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Téléphone</span></label>
                  <input type="text" name="tel_ens" value={formData.tel_ens} onChange={handleInputChange}
                    className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" required />
                </div>

                {/* Grade */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Grade académique</span></label>
                  <select name="id_grade" value={formData.id_grade} onChange={handleInputChange}
                    className="select bg-white border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium" required>
                    <option value={0} disabled>Sélectionner un grade</option>
                    {grades.map((g) => <option key={g.id_grade} value={g.id_grade}>{g.lib_grade}</option>)}
                  </select>
                </div>

                {/* Statut */}
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Statut contractuel</span></label>
                  <select name="id_statut" value={formData.id_statut} onChange={handleInputChange}
                    className="select bg-white border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium" required>
                    <option value={0} disabled>Sélectionner un statut</option>
                    {statuts.map((s) => <option key={s.id_statut} value={s.id_statut}>{s.lib_statut}</option>)}
                  </select>
                </div>

                {/* Département */}
                <div ref={departementRef} className="form-control relative md:col-span-2">
                  <label className="label"><span className="label-text text-sm uppercase font-black tracking-wider text-neutral">Département</span></label>
                  <input
                    type="text" value={departementQuery}
                    onChange={(e) => handleDepartementChange(e.target.value)}
                    onFocus={() => departementSuggestions.length > 0 && setShowDepartementSuggestions(true)}
                    placeholder="Tapez pour rechercher un département..."
                    className="input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  {showDepartementSuggestions && departementSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 z-20 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {departementSuggestions.map((d) => (
                        <div key={d.id_depart} onMouseDown={() => handleSelectDepartement(d)}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-200 last:border-0 text-sm font-medium">
                          {d.lib_depart}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Taux horaire (read-only) */}
                {(() => {
                  const selGrade = grades.find((g) => g.id_grade === Number(formData.id_grade));
                  const selStatut = statuts.find((s) => s.id_statut === Number(formData.id_statut));
                  const isVacataire = (selStatut?.lib_statut ?? "").toLowerCase().includes("vacataire");
                  const tauxPerm = selGrade?.taux_hor_permanent ?? 0;
                  const tauxVac = selGrade?.taux_hor_vacataire ?? 0;
                  return (
                    <div className="form-control md:col-span-2">
                      <label className="label">
                        <span className="label-text text-sm uppercase font-black tracking-wider text-neutral flex items-center gap-1.5">
                          <Lock size={11} /> Taux horaire (FCFA/H) — Calculé automatiquement
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className={`rounded-xl border-2 px-4 py-3 flex flex-col gap-1 transition-all ${!isVacataire && selGrade ? "border-success bg-success/10" : "border-base-300 bg-base-200/60 opacity-60"}`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral">Permanent</span>
                          <span className={`text-lg font-black ${!isVacataire && selGrade ? "text-success" : "text-neutral"}`}>
                            {tauxPerm.toLocaleString("fr-FR")} <span className="text-sm font-medium">FCFA/H</span>
                          </span>
                          {!isVacataire && selGrade && <span className="text-xs text-success font-semibold">← Taux appliqué</span>}
                        </div>
                        <div className={`rounded-xl border-2 px-4 py-3 flex flex-col gap-1 transition-all ${isVacataire && selGrade ? "border-warning bg-warning/10" : "border-base-300 bg-base-200/60 opacity-60"}`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral">Vacataire</span>
                          <span className={`text-lg font-black ${isVacataire && selGrade ? "text-warning" : "text-neutral"}`}>
                            {tauxVac.toLocaleString("fr-FR")} <span className="text-sm font-medium">FCFA/H</span>
                          </span>
                          {isVacataire && selGrade && <span className="text-xs text-warning font-semibold">← Taux appliqué</span>}
                        </div>
                      </div>
                      {!selGrade && <p className="text-sm text-neutral mt-2 ml-1">Sélectionnez un grade pour voir les taux applicables.</p>}
                    </div>
                  );
                })()}

                {/* Login (create mode only) */}
                {isCreating && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm uppercase font-black tracking-wider text-neutral">
                        Identifiant de connexion
                      </span>
                    </label>
                    <input
                      type="text" name="user_log_ens" value={formData.user_log_ens ?? ""}
                      onChange={handleInputChange}
                      readOnly={!!linkedAccount}
                      placeholder="Ex: kouadio.k"
                      className={`input input-bordered bg-transparent border-[#ead2e6] rounded-lg w-full outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${linkedAccount ? "opacity-60 cursor-not-allowed" : ""}`}
                      required
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Save button */}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={handleClose} className="btn btn-ghost rounded-xl normal-case font-bold" disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="btn btn-success rounded-xl normal-case font-black gap-2 shadow-lg px-8" disabled={saving}>
                <Save size={18} />
                {saving ? "Enregistrement..." : (selectedEnseignant ? "Enregistrer les modifications" : "Créer l'enseignant")}
              </button>
            </div>
          </form>
        )}

        {/* Teachers table */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-base-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <h2 className="font-black text-base-content">Liste des enseignants</h2>
            <span className="badge badge-ghost badge-sm font-bold ml-auto">{allEnseignants.length}</span>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/50 text-[11px] uppercase tracking-wider">
                    <th>Enseignant</th><th>Contact</th><th>Grade</th><th>Département</th><th>Statut</th><th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-base-200/50">
                      <td><div className="flex items-center gap-3"><div className="skeleton w-9 h-9 rounded-xl shrink-0"></div><div className="space-y-1.5"><div className="skeleton h-3 w-24"></div><div className="skeleton h-2 w-16"></div></div></div></td>
                      <td><div className="space-y-1.5"><div className="skeleton h-2 w-28"></div><div className="skeleton h-2 w-16"></div></div></td>
                      <td><div className="skeleton h-5 w-16 rounded-full"></div></td>
                      <td><div className="skeleton h-2 w-24"></div></td>
                      <td><div className="skeleton h-5 w-20 rounded-full"></div></td>
                      <td><div className="flex justify-center gap-2"><div className="skeleton h-6 w-16 rounded-xl"></div><div className="skeleton h-6 w-16 rounded-xl"></div></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : allEnseignants.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-xl bg-base-200 flex items-center justify-center">
                <Users size={28} className="text-neutral" />
              </div>
              <p className="font-black text-base-content">Aucun enseignant enregistré</p>
              <p className="text-sm text-neutral max-w-sm">Cliquez sur "Nouvel enseignant" pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/50 text-[11px] uppercase tracking-wider">
                    <th>Enseignant</th>
                    <th>Contact</th>
                    <th>Grade</th>
                    <th>Département</th>
                    <th>Statut</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allEnseignants.map((e) => {
                    const grade = grades.find((g) => g.id_grade === e.id_grade);
                    const statut = statuts.find((s) => s.id_statut === e.id_statut);
                    const depart = departements.find((d) => d.id_depart === e.id_depart);
                    return (
                      <tr key={e.id_ens} className="border-b border-base-200/50 hover:bg-base-200/30 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                              {e.nom_ens.charAt(0)}{e.pren_ens.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-base-content">{e.nom_ens} {e.pren_ens}</p>
                              <p className="text-sm text-neutral">{e.user_log_ens ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-sm">{e.email_ens}</p>
                          <p className="text-sm text-neutral">{e.tel_ens}</p>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-md font-medium">{grade?.lib_grade ?? "—"}</span>
                        </td>
                        <td className="text-sm text-neutral max-w-35 truncate">{depart?.lib_depart ?? "—"}</td>
                        <td>
                          <span className={`badge badge-sm font-bold border-none ${
                            statut?.lib_statut?.toLowerCase().includes("permanent")
                              ? "badge-success bg-success/10 text-success"
                              : "badge-warning bg-warning/10 text-warning"
                          }`}>
                            {statut?.lib_statut ?? "—"}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectEnseignant(e)}
                              className="btn btn-ghost btn-sm gap-1 text-primary hover:bg-primary/10 rounded-xl normal-case font-bold"
                            >
                              <Pencil size={13} /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ open: true, teacher: e })}
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

      {/* Delete confirmation modal */}
      {deleteModal.open && deleteModal.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-base-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base-content text-lg">Supprimer l'enseignant ?</h3>
                <p className="text-sm text-neutral mt-1">
                  <span className="font-bold text-base-content">
                    {deleteModal.teacher.nom_ens} {deleteModal.teacher.pren_ens}
                  </span>{" "}
                  sera définitivement supprimé(e). Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, teacher: null })}
                className="btn btn-ghost rounded-xl flex-1 normal-case font-bold"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
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
