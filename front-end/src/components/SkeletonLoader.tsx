/** Bloc gris animé — building block pour les skeletons de page */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-base-300/70 animate-pulse rounded-xl ${className}`} />;
}

/** Skeleton pour les dashboards (admin / secrétaire / enseignant) */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-72" />
          <Bone className="h-4 w-52" />
        </div>
        <Bone className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Bone className="lg:col-span-6 h-40" />
        <Bone className="lg:col-span-3 h-40" />
        <Bone className="lg:col-span-3 h-40" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Bone className="xl:col-span-8 h-72" />
        <Bone className="xl:col-span-4 h-72" />
      </div>
      <Bone className="h-64" />
    </div>
  );
}

/** Skeleton pour les pages avec tableau (EnseignantsList, GestionCours, etc.) */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-64" />
        </div>
        <Bone className="h-10 w-36" />
      </div>
      <Bone className="h-12 w-full" />
      <div className="rounded-xl overflow-hidden border border-base-200">
        <Bone className="h-12 rounded-none" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-base-200">
            <Bone className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="h-6 w-20" />
            <Bone className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton pour les pages de formulaire + tableau (SaisieValidation, GestionTaux, etc.) */
export function FormTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-72" />
          <Bone className="h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-28" />
          <Bone className="h-10 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Bone className="h-48" />
          <Bone className="h-32" />
        </div>
        <div className="space-y-4">
          <Bone className="h-56" />
          <Bone className="h-36" />
        </div>
      </div>
      <Bone className="h-64" />
    </div>
  );
}

/** Skeleton pour les pages d'export / documents */
export function ExportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <Bone className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Bone className="h-24" />
        <Bone className="h-24" />
        <Bone className="h-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Bone className="h-56" />
        <Bone className="h-56" />
        <Bone className="h-56" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Bone className="lg:col-span-2 h-48" />
        <Bone className="h-48" />
      </div>
    </div>
  );
}

/** Skeleton précis pour GestionTaux (barème + actions sidebar) */
export function GestionTauxSkeleton() {
  return (
    <div className="p-2 md:p-4 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-11 w-24" />
          <Bone className="h-11 w-36" />
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Grille rémunération */}
        <div className="lg:col-span-8 bg-base-100 rounded-xl border border-base-200 p-6 md:p-8 space-y-4">
          <Bone className="h-7 w-52" />
          {/* En-têtes colonnes */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 mb-1">
            <div className="col-span-3" />
            <Bone className="col-span-3 h-4" />
            <Bone className="col-span-3 h-4" />
            <Bone className="col-span-3 h-4" />
          </div>
          {/* Lignes grades */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:grid md:grid-cols-12 gap-3 p-4 rounded-xl bg-base-200/30"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="md:col-span-3 flex items-center gap-2">
                <Bone className="w-9 h-9 rounded-xl shrink-0" />
                <Bone className="h-4 flex-1" />
              </div>
              <Bone className="md:col-span-3 h-11 rounded-xl" />
              <Bone className="md:col-span-3 h-11 rounded-xl" />
              <Bone className="md:col-span-3 h-11 rounded-xl" />
            </div>
          ))}
          {/* Légende */}
          <Bone className="h-16 rounded-xl mt-2" />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-base-200/50 rounded-xl p-6 md:p-8 space-y-3">
            <Bone className="h-6 w-24 mb-4" />
            <Bone className="h-14 rounded-xl" />
            <Bone className="h-14 rounded-xl" />
          </div>
          <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
            <div className="p-4 border-b border-base-200">
              <Bone className="h-4 w-32" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-base-200/50">
                <Bone className="h-3 w-28" />
                <Bone className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton pour les pages de suivi (SuiviHeures, MesActivités) */
export function SuiviSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-72" />
          <Bone className="h-4 w-52" />
        </div>
        <Bone className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Bone className="h-20" />
        <Bone className="h-20" />
        <Bone className="h-20" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Bone className="lg:col-span-2 h-64" />
        <Bone className="h-64" />
      </div>
      <Bone className="h-72" />
    </div>
  );
}
