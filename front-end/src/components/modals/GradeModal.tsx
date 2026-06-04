import { useState, useEffect } from "react";
import { X, Save, Clock } from "lucide-react";
import { gradeService, type Grade } from "../../services/grade.service";
import { toast } from "react-toastify";

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GradeModal({ isOpen, onClose }: GradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localGrades, setLocalGrades] = useState<Grade[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchGrades();
    }
  }, [isOpen]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await gradeService.getAll();
      setLocalGrades(data);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Erreur lors du chargement des grades");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    idGrade: number,
    field: "taux_hor_permanent" | "taux_hor_vacataire",
    value: string
  ) => {
    const numValue = value === "" ? null : parseFloat(value);
    setLocalGrades((prev) =>
      prev.map((grade) =>
        grade.id_grade === idGrade ? { ...grade, [field]: numValue } : grade
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const grade of localGrades) {
        await gradeService.update(grade.id_grade, {
          taux_hor_permanent: grade.taux_hor_permanent,
          taux_hor_vacataire: grade.taux_hor_vacataire,
        });
      }

      toast.success("Quotas mis à jour avec succès");
      onClose();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Erreur lors de la mise à jour des quotas");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
            <Clock size={20} />
            Gestion des Quotas par Grade
          </h3>
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-none bg-base-200">
                    <th className="text-neutral font-bold">Grade</th>
                    <th className="text-neutral font-bold">
                      Quota Permanent (heures)
                    </th>
                    <th className="text-neutral font-bold">
                      Quota Vacataire (heures)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localGrades.map((grade) => (
                    <tr key={grade.id_grade} className="border-none hover:bg-base-200/50">
                      <td className="font-medium">{grade.lib_grade}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={grade.taux_hor_permanent ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              grade.id_grade,
                              "taux_hor_permanent",
                              e.target.value
                            )
                          }
                          className="input input-bordered input-sm w-32 bg-transparent border-[#ead2e6] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="Non défini"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={grade.taux_hor_vacataire ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              grade.id_grade,
                              "taux_hor_vacataire",
                              e.target.value
                            )
                          }
                          className="input input-bordered input-sm w-32 bg-transparent border-[#ead2e6] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="Non défini"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="btn btn-ghost rounded-xl normal-case"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary rounded-xl normal-case"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
