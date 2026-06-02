import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  MoreVertical,
  Users,
  Clock3,
} from "lucide-react";
import {
  dashboardService,
  type DashboardStats,
} from "../../services/dashboard.service";
import { toast } from "react-toastify";
import { notificationService } from "../../services/notification.service";
import { DashboardSkeleton } from "../../components/SkeletonLoader";

export default function SecretaireDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [isNotifying, setIsNotifying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await dashboardService.getStats(period);
        if (isMounted) {
          setStats(data);
        }
      } catch (error) {
        if (isMounted && !silent) {
          console.error("Error loading dashboard:", error);
          toast.error("Erreur lors du chargement du tableau de bord");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Auto-refresh toutes les 30 secondes (silencieux)
    const interval = setInterval(() => { if (isMounted) fetchData(true); }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [period, refreshKey]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  };

  const formatHours = (num: number): string => {
    return `${formatNumber(num)} h`;
  };

  const getInitials = (nom: string, prenom: string): string => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  };

  const moisFr: Record<string, string> = {
    "01": "Janv", "02": "Févr", "03": "Mars", "04": "Avr",
    "05": "Mai",  "06": "Juin", "07": "Juil", "08": "Août",
    "09": "Sept", "10": "Oct",  "11": "Nov",  "12": "Déc",
  };

  const formatMois = (mois: string): string => {
    if (mois.includes("-")) {
      const [, m] = mois.split("-");
      return moisFr[m] ?? mois;
    }
    return mois; // mode annuel → on affiche l'année telle quelle
  };

  const handleNotifyAll = async () => {
    if (!stats || stats.enseignantsDepassement.length === 0) {
      toast.warning("Aucun enseignant avec dépassement à notifier");
      return;
    }

    try {
      setIsNotifying(true);
      const response = await notificationService.notifyExceedingTeachers();

      if (response.success) {
        toast.success(
          `${response.data.total} notification(s) envoyée(s) avec succès`,
        );
      } else {
        toast.error(
          response.message || "Erreur lors de l'envoi des notifications",
        );
      }
    } catch (error) {
      console.error("Erreur de notification:", error);
      toast.error("Erreur lors de l'envoi des notifications");
    } finally {
      setIsNotifying(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error">Erreur lors du chargement des données</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-2 lg:p-2">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-primary text-white rounded-md p-5 sm:p-6 relative overflow-hidden shadow-xl animate-slide-up">
            <div className="space-y-3 relative z-10">
              <p className="uppercase tracking-[0.25em] text-[10px] sm:text-sm font-black text-white/70">
                Volume horaire global
              </p>

              <div className="flex items-end gap-2 flex-wrap">
                <h1 className="text-5xl sm:text-6xl font-black">
                  {stats.volumeHoraireGlobal}
                </h1>
                <span className="text-lg sm:text-xl font-bold mb-1">
                  Heures
                </span>
              </div>
              <p className="text-sm sm:text-sm text-white/70 font-medium">
                Année académique en cours :{" "}
                <span className="text-white font-black">
                  {stats.anneeAcademique ?? "—"}
                </span>
              </p>
            </div>

            <div className="absolute -right-2 -bottom-4 opacity-10">
              <Clock3 size={130} strokeWidth={1.2} />
            </div>
          </div>

          <div className="lg:col-span-3 bg-base-100 rounded-md p-5 sm:p-6 border border-base-300 shadow-sm flex flex-col justify-between animate-slide-up anim-d1">
            <div className="w-12 h-12 rounded-md bg-warning/20 flex items-center justify-center">
              <Users className="text-warning" size={22} />
            </div>

            <div className="mt-8">
              <h2 className="text-4xl font-black text-base-content">
                {stats.enseignantsActifs}
              </h2>
              <p className="text-sm text-neutral mt-1">Enseignants Actifs</p>
            </div>

            <div className="mt-4 w-full h-1.5 bg-warning/20 rounded-md overflow-hidden">
              <div className="w-[78%] h-full bg-warning rounded-md"></div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-base-100 rounded-md p-5 sm:p-6 border border-base-300 shadow-sm flex flex-col justify-between animate-slide-up anim-d2">
            <div className="w-12 h-12 rounded-md bg-error/10 flex items-center justify-center">
              <AlertTriangle className="text-error" size={22} />
            </div>

            <div className="mt-8">
              <h2 className="text-4xl font-black text-base-content">
                {stats.depassementsCritiques}
              </h2>
              <p className="text-sm text-neutral mt-1">
                Dépassements Critiques
              </p>
            </div>

            <div className="mt-4 w-full h-1.5 bg-error/10 rounded-md overflow-hidden">
              <div
                className="h-full bg-error rounded-md transition-all"
                style={{
                  width: `${Math.min((stats.depassementsCritiques / stats.enseignantsActifs) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 bg-base-100 rounded-xl p-5 sm:p-6 shadow-sm border border-base-300 animate-slide-up anim-d3">
            <div className="flex justify-between gap-2  p-1 rounded-lg">
              <h3 className="text-lg font-bold text-base-content">
                Production{" "}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md font-bold transition-all ${
                    period === "monthly"
                      ? "bg-primary text-primary-content shadow-md"
                      : "bg-transparent text-base-content hover:bg-base-300"
                  }`}
                  onClick={() => setPeriod("monthly")}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md font-bold transition-all ${
                    period === "annual"
                      ? "bg-primary text-primary-content shadow-md"
                      : "bg-transparent text-base-content hover:bg-base-300"
                  }`}
                  onClick={() => setPeriod("annual")}
                >
                  Annuel
                </button>
              </div>
            </div>

            <div className="mt-8">
              <div className="h-65 sm:h-75 flex items-end justify-between gap-2 sm:gap-4">
                {stats?.productionMensuelle &&
                stats.productionMensuelle.length > 0 ? (
                  (() => {
                    const maxTotal = Math.max(
                      ...stats.productionMensuelle.map((m) => Number(m.total)),
                    );
                    return stats.productionMensuelle.map((item, index) => {
                      const val = Number(item.total);
                      const height = maxTotal > 0 ? `${(val / maxTotal) * 100}%` : "0%";
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span className="text-[10px] font-bold text-primary">
                            {val > 0 ? `${val.toFixed(1)}h` : ""}
                          </span>
                          <div className="w-full bg-primary/20 rounded-t-xl relative overflow-hidden h-52">
                            <div
                              style={{ height }}
                              className="w-full rounded-t-xl bg-secondary/60 absolute bottom-0"
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-neutral mt-1">
                            {formatMois(item.mois)}
                          </span>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <p className="text-sm text-neutral">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 bg-base-100 rounded-xl p-5 sm:p-6 shadow-sm border border-base-300 animate-slide-up anim-d4">
            <div>
              <h3 className="text-lg font-black text-base-content">
                Par Département
              </h3>
            </div>

            <div className="mt-8 space-y-6">
              {stats?.heuresParDepartement &&
              stats.heuresParDepartement.length > 0 ? (
                stats.heuresParDepartement.map((item, index) => {
                  const colors = [
                    "bg-primary",
                    "bg-secondary",
                    "bg-accent",
                    "bg-base-300",
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-1.5 rounded-full min-h-12 ${color}`}
                        ></div>

                        <div>
                          <h4 className="font-bold text-sm text-base-content">
                            {item.name}
                          </h4>

                          <p className="text-sm text-neutral mt-1">
                            {item.desc || "-"}
                          </p>
                        </div>
                      </div>

                      <span className="font-black text-sm whitespace-nowrap">
                        {formatHours(item.hours)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-neutral">Aucun département</p>
              )}
            </div>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="btn btn-neutral w-full mt-8 rounded-xl border-none normal-case font-bold"
            >
              Actualiser
            </button>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl p-4 sm:p-6 border border-base-300 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-base-content">
                Enseignants en Dépassement d'Heures
              </h3>

              <p className="text-sm text-neutral mt-1">
                Alerte : Heures complémentaires excédant le quota légal
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="btn bg-error/10 hover:bg-error hover:text-white text-error border-none rounded-xl normal-case font-bold"
                onClick={handleNotifyAll}
                disabled={isNotifying}
              >
                <Bell size={16} />
                {isNotifying ? "Envoi..." : "Notifier Tout"}
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {stats?.enseignantsDepassement &&
            stats.enseignantsDepassement.length > 0 ? (
              <table className="table">
                <thead>
                  <tr className="border-none">
                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black">
                      Enseignant
                    </th>

                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black">
                      Département
                    </th>

                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black">
                      Quota Max
                    </th>

                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black">
                      Réalisé
                    </th>

                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black">
                      Excédent
                    </th>

                    <th className="bg-transparent uppercase text-[10px] tracking-[0.2em] text-neutral font-black text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {stats.enseignantsDepassement.map((teacher, index) => (
                    <tr
                      key={index}
                      className="border-none hover:bg-base-200/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-xl w-12 flex items-center justify-center">
                              <span className="font-black text-sm ">
                                {getInitials(teacher.nom, teacher.prenom)}
                              </span>
                            </div>
                          </div>

                          <span className="font-bold text-sm whitespace-nowrap">
                            {teacher.nom} {teacher.prenom}
                          </span>
                        </div>
                      </td>

                      <td className="text-sm text-neutral">
                        {teacher.departement}
                      </td>

                      <td className="font-medium">{teacher.quota}h</td>

                      <td className="font-black text-error">
                        {Math.round(teacher.done)}h
                      </td>

                      <td>
                        <div className="badge badge-error badge-soft font-bold rounded-xl">
                          +{Math.round(teacher.exceed)}h
                        </div>
                      </td>

                      <td className="text-right">
                        <button className="btn btn-ghost btn-circle btn-sm">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-neutral text-center py-8">
                Aucun dépassement détecté
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
