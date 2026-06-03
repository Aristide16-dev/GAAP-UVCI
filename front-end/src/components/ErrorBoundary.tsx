/**
 * ErrorBoundary — Capture les erreurs JavaScript non gérées dans les composants enfants
 *
 * Sans ce composant, une erreur dans n'importe quel composant fait crasher
 * silencieusement toute l'application. Avec ErrorBoundary, l'utilisateur
 * voit un message d'erreur clair au lieu d'une page blanche.
 *
 * Usage dans App.tsx :
 *   <ErrorBoundary>
 *     <Suspense fallback={<PageLoader />}>
 *       <Routes>...</Routes>
 *     </Suspense>
 *   </ErrorBoundary>
 */
import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Une erreur est survenue</h1>
              <p className="text-gray-500 mt-2 text-sm">
                L'application a rencontré un problème inattendu.
              </p>
              {this.state.errorMessage && (
                <p className="text-xs text-red-500 mt-2 font-mono bg-red-50 p-2 rounded">
                  {this.state.errorMessage}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary rounded-xl normal-case gap-2"
            >
              <RefreshCw size={16} />
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
