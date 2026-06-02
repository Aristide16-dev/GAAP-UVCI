import { useState, useEffect } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Save,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AtSign,
  CheckCircle2,
  GraduationCap,
  Building2,
  Award,
} from "lucide-react";
import { adminService } from "../services/admin.service";
import type { User as UserType, Role } from "../types";

interface UserFormProps {
  user?: UserType | null;
  onSave: (data: Partial<UserType> & { password?: string }) => void;
  onClose: () => void;
  isProfileEdit?: boolean;
}

interface Grade {
  id_grade: number;
  lib_grade: string;
  taux_hor_permanent: number;
  taux_hor_vacataire: number;
}

interface Departement { id_depart: number; lib_depart: string; }
interface Statut { id_statut: number; lib_statut: string; }

export default function UserForm({
  user,
  onSave,
  onClose,
  isProfileEdit = false,
}: UserFormProps) {
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(
    (user?.role as Role) || "enseignant",
  );
  const [grades, setGrades] = useState<Grade[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const isEditing = !!user;

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [gradesRes, departementsRes, statutsRes] = await Promise.all([
          adminService.getGrades(),
          adminService.getDepartements(),
          adminService.getStatuts(),
        ]);
        if (gradesRes.data) setGrades(gradesRes.data);
        if (departementsRes.data) setDepartements(departementsRes.data);
        if (statutsRes.data) setStatuts(statutsRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des références:", error);
      } finally {
        setLoadingRefs(false);
      }
    };

    loadRefs();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: Partial<UserType> & {
      password?: string;
      id_grade?: number;
      id_statut?: number;
      id_depart?: number;
    } = {
      login: formData.get("login") as string,
      nom: formData.get("nom") as string,
      email: formData.get("email") as string,
    };

    const passwordValue = formData.get("password") as string;
    if (passwordValue) {
      payload.password = passwordValue;
    }

    if (!isProfileEdit) {
      if (!isEditing) {
        payload.role = formData.get("role") as Role;
      }

      if (selectedRole === "enseignant") {
        const gradeValue = formData.get("grade") as string;
        payload.id_grade = gradeValue ? parseInt(gradeValue) : undefined;
        const statutValue = formData.get("statut") as string;
        payload.id_statut = statutValue ? parseInt(statutValue) : undefined;
        const departValue = formData.get("departement") as string;
        payload.id_depart = departValue ? parseInt(departValue) : undefined;
      }
    }

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-primary/10">
          <User size={20} className="text-primary" />
          <h3 className="font-bold text-gray-900 text-lg">
            Informations d'identité
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                <AtSign size={14} />
                Identifiant de connexion
              </span>
            </label>
            <input
              name="login"
              type="text"
              required
              defaultValue={(user?.login as string) || ""}
              placeholder="ex: jdupont"
              className="input input-bordered w-full h-12 bg-transparent border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="label">
              <span className="label-text-alt text-gray-500 text-sm">
                Utilisé pour se connecter
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                <User size={14} />
                Nom complet
              </span>
            </label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={user?.nom || ""}
              placeholder="Prénom Nom"
              className="input input-bordered w-full h-12 bg-transparent border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Mail size={14} />
              Adresse e-mail professionnelle
            </span>
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email || ""}
            placeholder="nom.prenom@uvci.edu.ci"
            className="input input-bordered w-full h-12 bg-transparent border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {!isProfileEdit && !isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-primary/10">
            <ShieldCheck size={20} className="text-primary" />
            <h3 className="font-bold text-gray-900 text-lg">
              Rôle et permissions
            </h3>
          </div>

          {!isEditing && (
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Rôle utilisateur
                </span>
              </label>
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="select select-bordered w-full h-12 bg-white border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="administrateur">Administrateur</option>
                <option value="secretaire">Secrétaire</option>
                <option value="enseignant">Enseignant</option>
              </select>
            </div>
          )}
        </div>
      )}

      {selectedRole === "enseignant" && !isProfileEdit && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-primary/10">
            <GraduationCap size={20} className="text-primary" />
            <h3 className="font-bold text-gray-900 text-lg">
              Informations académiques
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  <Award size={14} />
                  Grade
                </span>
              </label>
              <select
                name="grade"
                required
                disabled={loadingRefs}
                className="select select-bordered w-full h-12 bg-white border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {loadingRefs ? "Chargement..." : "Sélectionner un grade"}
                </option>
                {grades.map((grade) => (
                  <option key={grade.id_grade} value={grade.id_grade}>
                    {grade.lib_grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Statut
                </span>
              </label>
              <select
                name="statut"
                required
                disabled={loadingRefs}
                className="select select-bordered w-full h-12 bg-white border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {loadingRefs ? "Chargement..." : "Sélectionner un statut"}
                </option>
                {statuts.map((s) => (
                  <option key={s.id_statut} value={s.id_statut}>
                    {s.lib_statut}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  <Building2 size={14} />
                  Département
                </span>
              </label>
              <select
                name="departement"
                required
                disabled={loadingRefs}
                className="select select-bordered w-full h-12 bg-white border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {loadingRefs ? "Chargement..." : "Sélectionner un département"}
                </option>
                {departements.map((d) => (
                  <option key={d.id_depart} value={d.id_depart}>
                    {d.lib_depart}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-primary/10">
          <Lock size={20} className="text-primary" />
          <h3 className="font-bold text-gray-900 text-lg">Sécurité et accès</h3>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Lock size={14} />
              {isEditing
                ? "Nouveau mot de passe (optionnel)"
                : "Mot de passe initial"}
            </span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              required={!isEditing}
              placeholder={
                isEditing
                  ? "Laisser vide pour conserver l'actuel"
                  : "Minimum 6 caractères"
              }
              className="input input-bordered w-full pr-12 h-12 bg-transparent border-[#ead2e6] rounded-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!isEditing && (
            <label className="label">
              <span className="label-text-alt text-gray-500 text-sm flex items-center gap-1">
                <CheckCircle2 size={12} className="text-success" />
                L'utilisateur pourra le modifier à sa première connexion
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t-2 border-base-300">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost flex-1 h-12 rounded-xl font-semibold hover:bg-base-200 transition-colors normal-case"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn bg-primary hover:bg-primary/90 text-primary-content border-none flex-1 h-12 rounded-xl gap-2 shadow-lg shadow-primary/20 font-bold normal-case"
        >
          {isEditing ? (
            <>
              <Save size={20} />
              Enregistrer les modifications
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Créer le compte
            </>
          )}
        </button>
      </div>
    </form>
  );
}
