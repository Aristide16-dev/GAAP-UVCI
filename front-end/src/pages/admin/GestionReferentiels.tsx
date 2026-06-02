import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit, Trash2, Save, X, GraduationCap,
  Building2, ShieldCheck, BookOpen, FileType2, Zap,
  AlertTriangle, Check, RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../../services/admin.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Grade { id_grade: number; lib_grade: string; taux_hor_permanent: number; taux_hor_vacataire: number; }
interface Departement { id_depart: number; lib_depart: string; }
interface Statut { id_statut: number; lib_statut: string; }
interface Niveau { id_niveau: number; lib_niveau: string; }
interface TypeRessource {
  id_typ_res: number;
  typ_res: string;
  id_niv_complex?: number | null;
  lib_niv_complex?: string | null;
  coeff_niv_complex?: number | null;
}
interface NiveauComplexiteRef { id_niv_complex: number; lib_niv_complex: string; coeff_niv_complex: number; }
interface TypeActivite { id_typ_activite: number; lib_activite: string; multiplicateur_base?: number; }

type TabId = "grades" | "departements" | "statuts" | "niveaux" | "types-ressources" | "types-activites";

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  isOpen, title, message, onConfirm, onCancel,
}: {
  isOpen: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-ghost flex-1 rounded-xl normal-case">Annuler</button>
          <button onClick={onConfirm} className="btn bg-red-600 hover:bg-red-700 text-white border-none flex-1 rounded-xl normal-case">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Generic Simple Entity Tab ─────────────────────────────────────────────────
// Used for Departement, Statut, Niveau, TypeRessource (single label field)

interface SimpleItem { id: number; label: string; }

function SimpleEntityTab({
  items, loading, labelPlaceholder,
  onCreate, onUpdate, onDelete,
}: {
  items: SimpleItem[];
  loading: boolean;
  labelPlaceholder: string;
  onCreate: (label: string) => Promise<void>;
  onUpdate: (id: number, label: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [addLabel, setAddLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SimpleItem | null>(null);

  const handleAdd = async () => {
    if (!addLabel.trim()) { toast.error("Veuillez saisir un libellé"); return; }
    setAdding(true);
    try {
      await onCreate(addLabel.trim());
      setAddLabel("");
      setShowAddForm(false);
      toast.success("Élément ajouté avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de l'ajout");
    } finally { setAdding(false); }
  };

  const handleEdit = (item: SimpleItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
  };

  const handleSaveEdit = async () => {
    if (!editLabel.trim()) { toast.error("Libellé requis"); return; }
    if (editingId === null) return;
    setSaving(true);
    try {
      await onUpdate(editingId, editLabel.trim());
      setEditingId(null);
      toast.success("Modifié avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la modification");
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: SimpleItem) => {
    try {
      await onDelete(item.id);
      setConfirmDelete(null);
      toast.success("Supprimé avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Impossible de supprimer cet élément");
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
            <div className="h-4 bg-base-300 rounded-lg w-1/3"></div>
            <div className="h-4 bg-base-300 rounded-lg w-1/4 ml-auto"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAddForm(true); setAddLabel(""); }}
          className="btn btn-sm bg-primary text-white border-none rounded-xl gap-2 normal-case hover:bg-primary/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-center">
          <input
            type="text"
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={labelPlaceholder}
            className="input input-bordered input-sm flex-1 rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn btn-sm bg-primary text-white border-none rounded-lg normal-case gap-1"
          >
            {adding ? <span className="loading loading-spinner loading-sm"></span> : <Check size={14} />}
            Valider
          </button>
          <button
            onClick={() => { setShowAddForm(false); setAddLabel(""); }}
            className="btn btn-sm btn-ghost rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">Aucun élément enregistré</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter" pour créer le premier.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-sm font-bold uppercase text-gray-500 w-12">#</th>
                <th className="text-sm font-bold uppercase text-gray-500">Libellé</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="text-sm text-gray-400 font-mono">{idx + 1}</td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{item.label}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="btn btn-sm bg-green-600 text-white border-none rounded-lg normal-case"
                        >
                          {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={12} />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-sm btn-ghost rounded-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn btn-sm bg-blue-600 text-white border-none rounded-lg normal-case"
                          title="Modifier"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          className="btn btn-sm bg-red-600 text-white border-none rounded-lg normal-case"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer cet élément"
        message={`Voulez-vous vraiment supprimer "${confirmDelete?.label}" ?\n\nCette action est irréversible. Si cet élément est utilisé, la suppression sera refusée.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Grades Tab ────────────────────────────────────────────────────────────────

function GradesTab({
  grades, loading, onRefresh,
}: {
  grades: Grade[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ lib_grade: "", taux_hor_permanent: "", taux_hor_vacataire: "" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ lib_grade: "", taux_hor_permanent: "", taux_hor_vacataire: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Grade | null>(null);

  const handleAdd = async () => {
    if (!addData.lib_grade.trim()) { toast.error("Libellé du grade requis"); return; }
    setAdding(true);
    try {
      await adminService.createGrade({
        lib_grade: addData.lib_grade.trim(),
        taux_hor_permanent: addData.taux_hor_permanent ? Number(addData.taux_hor_permanent) : 0,
        taux_hor_vacataire: addData.taux_hor_vacataire ? Number(addData.taux_hor_vacataire) : 0,
      });
      setAddData({ lib_grade: "", taux_hor_permanent: "", taux_hor_vacataire: "" });
      setShowAddForm(false);
      onRefresh();
      toast.success("Grade créé avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la création");
    } finally { setAdding(false); }
  };

  const handleEdit = (g: Grade) => {
    setEditingId(g.id_grade);
    setEditData({ lib_grade: g.lib_grade, taux_hor_permanent: String(g.taux_hor_permanent), taux_hor_vacataire: String(g.taux_hor_vacataire) });
  };

  const handleSaveEdit = async () => {
    if (!editData.lib_grade.trim()) { toast.error("Libellé requis"); return; }
    if (editingId === null) return;
    setSaving(true);
    try {
      await adminService.updateGrade(editingId, {
        lib_grade: editData.lib_grade.trim(),
        taux_hor_permanent: editData.taux_hor_permanent ? Number(editData.taux_hor_permanent) : 0,
        taux_hor_vacataire: editData.taux_hor_vacataire ? Number(editData.taux_hor_vacataire) : 0,
      });
      setEditingId(null);
      onRefresh();
      toast.success("Grade modifié avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la modification");
    } finally { setSaving(false); }
  };

  const handleDelete = async (g: Grade) => {
    try {
      await adminService.deleteGrade(g.id_grade);
      setConfirmDelete(null);
      onRefresh();
      toast.success("Grade supprimé");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Impossible de supprimer ce grade");
      setConfirmDelete(null);
    }
  };

  const fmt = (n: number) => n?.toLocaleString("fr-FR") + " FCFA";

  if (loading) {
    return (
      <div className="space-y-3 py-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
            <div className="h-4 bg-base-300 rounded-lg w-1/3"></div>
            <div className="h-4 bg-base-300 rounded-lg w-1/4 ml-auto"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Les taux horaires peuvent aussi être ajustés depuis <strong>Gestion des Taux</strong>.
        </p>
        <button
          onClick={() => { setShowAddForm(true); setAddData({ lib_grade: "", taux_hor_permanent: "", taux_hor_vacataire: "" }); }}
          className="btn btn-sm bg-primary text-white border-none rounded-xl gap-2 normal-case hover:bg-primary/90"
        >
          <Plus size={16} /> Nouveau grade
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Nouveau grade</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Libellé *</label>
              <input
                type="text"
                value={addData.lib_grade}
                onChange={(e) => setAddData((p) => ({ ...p, lib_grade: e.target.value }))}
                placeholder="ex: Professeur"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Taux Permanent (FCFA)</label>
              <input
                type="number"
                value={addData.taux_hor_permanent}
                onChange={(e) => setAddData((p) => ({ ...p, taux_hor_permanent: e.target.value }))}
                placeholder="0"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Taux Vacataire (FCFA)</label>
              <input
                type="number"
                value={addData.taux_hor_vacataire}
                onChange={(e) => setAddData((p) => ({ ...p, taux_hor_vacataire: e.target.value }))}
                placeholder="0"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="btn btn-sm bg-primary text-white border-none rounded-lg normal-case gap-1"
            >
              {adding ? <span className="loading loading-spinner loading-sm"></span> : <Check size={14} />}
              Créer
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm btn-ghost rounded-lg normal-case">
              Annuler
            </button>
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">Aucun grade enregistré</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-sm font-bold uppercase text-gray-500">Grade</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-right">Taux Permanent</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-right">Taux Vacataire</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id_grade} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td>
                    {editingId === g.id_grade ? (
                      <input
                        type="text"
                        value={editData.lib_grade}
                        onChange={(e) => setEditData((p) => ({ ...p, lib_grade: e.target.value }))}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap size={16} className="text-primary" />
                        </div>
                        <span className="font-semibold text-gray-900">{g.lib_grade}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-right">
                    {editingId === g.id_grade ? (
                      <input
                        type="number"
                        value={editData.taux_hor_permanent}
                        onChange={(e) => setEditData((p) => ({ ...p, taux_hor_permanent: e.target.value }))}
                        className="input input-bordered input-sm w-full rounded-lg text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-700">{fmt(g.taux_hor_permanent)}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {editingId === g.id_grade ? (
                      <input
                        type="number"
                        value={editData.taux_hor_vacataire}
                        onChange={(e) => setEditData((p) => ({ ...p, taux_hor_vacataire: e.target.value }))}
                        className="input input-bordered input-sm w-full rounded-lg text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-700">{fmt(g.taux_hor_vacataire)}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {editingId === g.id_grade ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="btn btn-sm bg-green-600 text-white border-none rounded-lg"
                        >
                          {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={12} />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn btn-sm btn-ghost rounded-lg">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(g)}
                          className="btn btn-sm bg-blue-600 text-white border-none rounded-lg"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(g)}
                          className="btn btn-sm bg-red-600 text-white border-none rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer ce grade"
        message={`Voulez-vous vraiment supprimer le grade "${confirmDelete?.lib_grade}" ?\n\nCette action est irréversible. Si ce grade est attribué à des enseignants, la suppression sera refusée.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Types d'activités Tab ─────────────────────────────────────────────────────

function TypesActivitesTab({
  items, loading, onRefresh,
}: {
  items: TypeActivite[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ lib_activite: "", multiplicateur_base: "" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ lib_activite: "", multiplicateur_base: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TypeActivite | null>(null);

  const handleAdd = async () => {
    if (!addData.lib_activite.trim()) { toast.error("Libellé requis"); return; }
    setAdding(true);
    try {
      await adminService.createTypeActivite({
        lib_activite: addData.lib_activite.trim(),
        multiplicateur_base: addData.multiplicateur_base ? Number(addData.multiplicateur_base) : undefined,
      });
      setAddData({ lib_activite: "", multiplicateur_base: "" });
      setShowAddForm(false);
      onRefresh();
      toast.success("Type d'activité créé");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la création");
    } finally { setAdding(false); }
  };

  const handleSaveEdit = async () => {
    if (!editData.lib_activite.trim()) { toast.error("Libellé requis"); return; }
    if (editingId === null) return;
    setSaving(true);
    try {
      await adminService.updateTypeActivite(editingId, {
        lib_activite: editData.lib_activite.trim(),
        multiplicateur_base: editData.multiplicateur_base ? Number(editData.multiplicateur_base) : undefined,
      });
      setEditingId(null);
      onRefresh();
      toast.success("Modifié avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la modification");
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: TypeActivite) => {
    try {
      await adminService.deleteTypeActivite(item.id_typ_activite);
      setConfirmDelete(null);
      onRefresh();
      toast.success("Supprimé");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Impossible de supprimer");
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
            <div className="h-4 bg-base-300 rounded-lg w-1/3"></div>
            <div className="h-4 bg-base-300 rounded-lg w-1/4 ml-auto"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAddForm(true); setAddData({ lib_activite: "", multiplicateur_base: "" }); }}
          className="btn btn-sm bg-primary text-white border-none rounded-xl gap-2 normal-case hover:bg-primary/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Nouveau type d'activité</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Libellé *</label>
              <input
                type="text"
                value={addData.lib_activite}
                onChange={(e) => setAddData((p) => ({ ...p, lib_activite: e.target.value }))}
                placeholder="ex: Création de ressources"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Multiplicateur de base</label>
              <input
                type="number"
                step="0.01"
                value={addData.multiplicateur_base}
                onChange={(e) => setAddData((p) => ({ ...p, multiplicateur_base: e.target.value }))}
                placeholder="ex: 1.0"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="btn btn-sm bg-primary text-white border-none rounded-lg normal-case gap-1"
            >
              {adding ? <span className="loading loading-spinner loading-sm"></span> : <Check size={14} />}
              Créer
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm btn-ghost rounded-lg normal-case">
              Annuler
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">Aucun type d'activité enregistré</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-sm font-bold uppercase text-gray-500 w-12">#</th>
                <th className="text-sm font-bold uppercase text-gray-500">Libellé</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-center">Multiplicateur</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id_typ_activite} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="text-sm text-gray-400 font-mono">{idx + 1}</td>
                  <td>
                    {editingId === item.id_typ_activite ? (
                      <input
                        type="text"
                        value={editData.lib_activite}
                        onChange={(e) => setEditData((p) => ({ ...p, lib_activite: e.target.value }))}
                        className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{item.lib_activite}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {editingId === item.id_typ_activite ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.multiplicateur_base}
                        onChange={(e) => setEditData((p) => ({ ...p, multiplicateur_base: e.target.value }))}
                        className="input input-bordered input-sm w-32 rounded-lg text-center"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        {item.multiplicateur_base != null ? item.multiplicateur_base : <span className="text-gray-300 italic">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {editingId === item.id_typ_activite ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="btn btn-sm bg-green-600 text-white border-none rounded-lg"
                        >
                          {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={12} />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn btn-sm btn-ghost rounded-lg">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingId(item.id_typ_activite); setEditData({ lib_activite: item.lib_activite, multiplicateur_base: item.multiplicateur_base != null ? String(item.multiplicateur_base) : "" }); }}
                          className="btn btn-sm bg-blue-600 text-white border-none rounded-lg"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          className="btn btn-sm bg-red-600 text-white border-none rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer ce type d'activité"
        message={`Voulez-vous vraiment supprimer "${confirmDelete?.lib_activite}" ? Cette action est irréversible.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Types de Ressources Tab ───────────────────────────────────────────────────

const LEVEL_STYLES: Record<number, { badge: string; dot: string; label: string; desc: string }> = {
  1: { badge: "bg-green-100 text-green-700 border border-green-200",  dot: "bg-green-500",  label: "Niveau 1", desc: "Contenus textuels, quiz, évaluations" },
  2: { badge: "bg-blue-100 text-blue-700 border border-blue-200",    dot: "bg-blue-500",   label: "Niveau 2", desc: "Niveau 1 + ≥ 25 % activités interactives" },
  3: { badge: "bg-purple-100 text-purple-700 border border-purple-200", dot: "bg-purple-500", label: "Niveau 3", desc: "Serious games, simulations, haute qualité" },
};

function getNiveauOrder(niveaux: NiveauComplexiteRef[], id: number | null | undefined): number {
  if (!id) return 0;
  const idx = niveaux.findIndex((n) => n.id_niv_complex === id);
  return idx + 1; // 1-based position as proxy for level number
}

function NiveauBadge({ niveauOrder, label }: { niveauOrder: number; label: string | null | undefined }) {
  const style = LEVEL_STYLES[niveauOrder];
  if (!style || !label) return <span className="text-sm text-gray-300 italic">— Non défini</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

function TypeRessourceTab({
  items, niveaux, loading, onRefresh,
}: {
  items: TypeRessource[];
  niveaux: NiveauComplexiteRef[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ typ_res: "", id_niv_complex: "" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ typ_res: "", id_niv_complex: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TypeRessource | null>(null);

  const handleAdd = async () => {
    if (!addData.typ_res.trim()) { toast.error("Libellé requis"); return; }
    setAdding(true);
    try {
      await adminService.createTypeRessource({
        typ_res: addData.typ_res.trim(),
        id_niv_complex: addData.id_niv_complex ? Number(addData.id_niv_complex) : null,
      });
      setAddData({ typ_res: "", id_niv_complex: "" });
      setShowAddForm(false);
      onRefresh();
      toast.success("Type de ressource créé");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la création");
    } finally { setAdding(false); }
  };

  const handleSaveEdit = async () => {
    if (!editData.typ_res.trim()) { toast.error("Libellé requis"); return; }
    if (editingId === null) return;
    setSaving(true);
    try {
      await adminService.updateTypeRessource(editingId, {
        typ_res: editData.typ_res.trim(),
        id_niv_complex: editData.id_niv_complex ? Number(editData.id_niv_complex) : null,
      });
      setEditingId(null);
      onRefresh();
      toast.success("Modifié avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Erreur lors de la modification");
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: TypeRessource) => {
    try {
      await adminService.deleteTypeRessource(item.id_typ_res);
      setConfirmDelete(null);
      onRefresh();
      toast.success("Supprimé avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Impossible de supprimer cet élément");
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
            <div className="h-4 bg-base-300 rounded-lg w-1/3"></div>
            <div className="h-6 bg-base-300 rounded-full w-24 ml-auto"></div>
            <div className="h-8 w-8 bg-base-300 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Légende des niveaux */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        {niveaux.slice(0, 3).map((n, idx) => {
          const order = idx + 1;
          const s = LEVEL_STYLES[order];
          return (
            <div key={n.id_niv_complex} className={`flex items-start gap-2 p-3 rounded-lg ${s?.badge ?? ""}`}>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s?.dot ?? "bg-gray-400"}`} />
              <div>
                <p className="text-sm font-black">{n.lib_niv_complex}</p>
                <p className="text-sm opacity-75 mt-0.5">{s?.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { setShowAddForm(true); setAddData({ typ_res: "", id_niv_complex: "" }); }}
          className="btn btn-sm bg-primary text-white border-none rounded-xl gap-2 normal-case hover:bg-primary/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Nouveau type de ressource</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Libellé *</label>
              <input
                type="text"
                value={addData.typ_res}
                onChange={(e) => setAddData((p) => ({ ...p, typ_res: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="ex: Vidéo pédagogique"
                className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase mb-1 block">Niveau de complexité *</label>
              <select
                value={addData.id_niv_complex}
                onChange={(e) => setAddData((p) => ({ ...p, id_niv_complex: e.target.value }))}
                className="select select-bordered select-sm w-full rounded-lg focus:border-primary"
              >
                <option value="">— Choisir un niveau —</option>
                {niveaux.map((n, idx) => (
                  <option key={n.id_niv_complex} value={n.id_niv_complex}>
                    {n.lib_niv_complex} — {LEVEL_STYLES[idx + 1]?.desc ?? ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="btn btn-sm bg-primary text-white border-none rounded-lg normal-case gap-1">
              {adding ? <span className="loading loading-spinner loading-sm"></span> : <Check size={14} />}
              Créer
            </button>
            <button onClick={() => { setShowAddForm(false); setAddData({ typ_res: "", id_niv_complex: "" }); }} className="btn btn-sm btn-ghost rounded-lg normal-case">
              Annuler
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">Aucun type de ressource enregistré</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter" pour créer le premier.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-sm font-bold uppercase text-gray-500 w-10">#</th>
                <th className="text-sm font-bold uppercase text-gray-500">Libellé</th>
                <th className="text-sm font-bold uppercase text-gray-500">Niveau de complexité</th>
                <th className="text-sm font-bold uppercase text-gray-500 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const niveauOrder = getNiveauOrder(niveaux, item.id_niv_complex);
                return (
                  <tr key={item.id_typ_res} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="text-sm text-gray-400 font-mono">{idx + 1}</td>
                    <td>
                      {editingId === item.id_typ_res ? (
                        <input
                          type="text"
                          value={editData.typ_res}
                          onChange={(e) => setEditData((p) => ({ ...p, typ_res: e.target.value }))}
                          className="input input-bordered input-sm w-full rounded-lg bg-transparent border-[#ead2e6] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{item.typ_res}</span>
                      )}
                    </td>
                    <td>
                      {editingId === item.id_typ_res ? (
                        <select
                          value={editData.id_niv_complex}
                          onChange={(e) => setEditData((p) => ({ ...p, id_niv_complex: e.target.value }))}
                          className="select select-bordered select-sm rounded-lg focus:border-primary"
                        >
                          <option value="">— Aucun —</option>
                          {niveaux.map((n, i) => (
                            <option key={n.id_niv_complex} value={n.id_niv_complex}>
                              {n.lib_niv_complex} — {LEVEL_STYLES[i + 1]?.desc ?? ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <NiveauBadge niveauOrder={niveauOrder} label={item.lib_niv_complex} />
                      )}
                    </td>
                    <td className="text-center">
                      {editingId === item.id_typ_res ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={handleSaveEdit} disabled={saving} className="btn btn-sm bg-green-600 text-white border-none rounded-lg">
                            {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={12} />}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-ghost rounded-lg"><X size={12} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingId(item.id_typ_res); setEditData({ typ_res: item.typ_res, id_niv_complex: item.id_niv_complex ? String(item.id_niv_complex) : "" }); }}
                            className="btn btn-sm bg-blue-600 text-white border-none rounded-lg"
                          >
                            <Edit size={12} />
                          </button>
                          <button onClick={() => setConfirmDelete(item)} className="btn btn-sm bg-red-600 text-white border-none rounded-lg">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer ce type de ressource"
        message={`Voulez-vous vraiment supprimer "${confirmDelete?.typ_res}" ?\n\nSi ce type est utilisé par des ressources existantes, la suppression sera refusée.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: "grades", label: "Grades", icon: GraduationCap, description: "Grades académiques des enseignants et leurs taux horaires" },
  { id: "departements", label: "Départements", icon: Building2, description: "Départements et unités de formation de l'université" },
  { id: "statuts", label: "Statuts", icon: ShieldCheck, description: "Statuts des enseignants (Permanent, Vacataire, etc.)" },
  { id: "niveaux", label: "Niveaux d'études", icon: BookOpen, description: "Niveaux académiques des cours (L1, L2, L3, M1, M2)" },
  { id: "types-ressources", label: "Types de ressources", icon: FileType2, description: "Catégories de supports de cours utilisées par la secrétaire lors de la saisie des activités pédagogiques (ex: Vidéo, Document PDF, Quiz, Slide…)" },
  { id: "types-activites", label: "Types d'activités", icon: Zap, description: "Types d'activités pédagogiques avec leurs multiplicateurs de calcul" },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GestionReferentiels() {
  const [activeTab, setActiveTab] = useState<TabId>("grades");
  const [loading, setLoading] = useState(true);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [typesRessources, setTypesRessources] = useState<TypeRessource[]>([]);
  const [typesActivites, setTypesActivites] = useState<TypeActivite[]>([]);
  const [niveauxComplexite, setNiveauxComplexite] = useState<NiveauComplexiteRef[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gradesRes, departementsRes, statutsRes, niveauxRes, typesResRes, typesActRes, nivComplexRes] = await Promise.all([
        adminService.getGrades(),
        adminService.getDepartements(),
        adminService.getStatuts(),
        adminService.getNiveaux(),
        adminService.getTypesRessources(),
        adminService.getTypesActivites(),
        adminService.getNiveauxComplexite(),
      ]);
      if (gradesRes.data) setGrades(gradesRes.data);
      if (departementsRes.data) setDepartements(departementsRes.data);
      if (statutsRes.data) setStatuts(statutsRes.data);
      if (niveauxRes.data) setNiveaux(niveauxRes.data);
      if (typesResRes.data) setTypesRessources(typesResRes.data);
      if (typesActRes.data) setTypesActivites(typesActRes.data);
      if (nivComplexRes.data) setNiveauxComplexite(nivComplexRes.data);
    } catch {
      toast.error("Erreur lors du chargement des référentiels");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTab = useCallback(async (tab: TabId) => {
    setLoading(true);
    try {
      switch (tab) {
        case "grades": { const r = await adminService.getGrades(); if (r.data) setGrades(r.data); break; }
        case "departements": { const r = await adminService.getDepartements(); if (r.data) setDepartements(r.data); break; }
        case "statuts": { const r = await adminService.getStatuts(); if (r.data) setStatuts(r.data); break; }
        case "niveaux": { const r = await adminService.getNiveaux(); if (r.data) setNiveaux(r.data); break; }
        case "types-ressources": {
          const [r, nc] = await Promise.all([adminService.getTypesRessources(), adminService.getNiveauxComplexite()]);
          if (r.data) setTypesRessources(r.data);
          if (nc.data) setNiveauxComplexite(nc.data);
          break;
        }
        case "types-activites": { const r = await adminService.getTypesActivites(); if (r.data) setTypesActivites(r.data); break; }
      }
    } catch {
      toast.error("Erreur lors du rechargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const simpleTabProps = (tab: TabId) => ({
    loading,
    ...(tab === "departements" && {
      items: departements.map((d) => ({ id: d.id_depart, label: d.lib_depart })),
      labelPlaceholder: "ex: Sciences et Technologies",
      onCreate: async (label: string) => { await adminService.createDepartement({ lib_depart: label }); await loadTab(tab); },
      onUpdate: async (id: number, label: string) => { await adminService.updateDepartement(id, { lib_depart: label }); await loadTab(tab); },
      onDelete: async (id: number) => { await adminService.deleteDepartement(id); await loadTab(tab); },
    }),
    ...(tab === "statuts" && {
      items: statuts.map((s) => ({ id: s.id_statut, label: s.lib_statut })),
      labelPlaceholder: "ex: Permanent",
      onCreate: async (label: string) => { await adminService.createStatut({ lib_statut: label }); await loadTab(tab); },
      onUpdate: async (id: number, label: string) => { await adminService.updateStatut(id, { lib_statut: label }); await loadTab(tab); },
      onDelete: async (id: number) => { await adminService.deleteStatut(id); await loadTab(tab); },
    }),
    ...(tab === "niveaux" && {
      items: niveaux.map((n) => ({ id: n.id_niveau, label: n.lib_niveau })),
      labelPlaceholder: "ex: L1, L2, M1…",
      onCreate: async (label: string) => { await adminService.createNiveau({ lib_niveau: label }); await loadTab(tab); },
      onUpdate: async (id: number, label: string) => { await adminService.updateNiveau(id, { lib_niveau: label }); await loadTab(tab); },
      onDelete: async (id: number) => { await adminService.deleteNiveau(id); await loadTab(tab); },
    }),
    ...(tab === "types-ressources" && {
      items: typesRessources.map((t) => ({ id: t.id_typ_res, label: t.typ_res })),
      labelPlaceholder: "ex: Vidéo pédagogique",
      onCreate: async (label: string) => { await adminService.createTypeRessource({ typ_res: label }); await loadTab(tab); },
      onUpdate: async (id: number, label: string) => { await adminService.updateTypeRessource(id, { typ_res: label }); await loadTab(tab); },
      onDelete: async (id: number) => { await adminService.deleteTypeRessource(id); await loadTab(tab); },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestion des Référentiels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les données de référence utilisées dans toute l'application.
          </p>
        </div>
        <button
          onClick={() => loadTab(activeTab)}
          className="btn btn-ghost btn-sm gap-2 rounded-xl normal-case text-gray-500 hover:bg-gray-100"
          title="Actualiser"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up anim-d1">
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {!loading && (
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                      {tab.id === "grades" ? grades.length
                        : tab.id === "departements" ? departements.length
                        : tab.id === "statuts" ? statuts.length
                        : tab.id === "niveaux" ? niveaux.length
                        : tab.id === "types-ressources" ? typesRessources.length
                        : typesActivites.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <currentTab.icon size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentTab.label}</h2>
              <p className="text-sm text-gray-400">{currentTab.description}</p>
            </div>
          </div>

          {activeTab === "grades" && (
            <GradesTab grades={grades} loading={loading} onRefresh={() => loadTab("grades")} />
          )}
          {activeTab === "departements" && (
            <SimpleEntityTab {...(simpleTabProps("departements") as Parameters<typeof SimpleEntityTab>[0])} />
          )}
          {activeTab === "statuts" && (
            <SimpleEntityTab {...(simpleTabProps("statuts") as Parameters<typeof SimpleEntityTab>[0])} />
          )}
          {activeTab === "niveaux" && (
            <SimpleEntityTab {...(simpleTabProps("niveaux") as Parameters<typeof SimpleEntityTab>[0])} />
          )}
          {activeTab === "types-ressources" && (
            <TypeRessourceTab
              items={typesRessources}
              niveaux={niveauxComplexite}
              loading={loading}
              onRefresh={() => loadTab("types-ressources")}
            />
          )}
          {activeTab === "types-activites" && (
            <TypesActivitesTab items={typesActivites} loading={loading} onRefresh={() => loadTab("types-activites")} />
          )}
        </div>
      </div>
    </div>
  );
}
