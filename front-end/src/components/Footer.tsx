import { Mail, Mailbox } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primary text-white flex flex-col md:flex-row justify-between items-center p-9 mt-10 gap-2">
      <aside className="flex flex-col items-center md:items-start gap-4">
        <div className="bg-white rounded-xl p-3 shadow-sm flex justify-center items-center">
          <Link to="/" aria-label="Accueil">
            <img src="/apple-icon.png" alt="Logo" width={70} height={70} />
          </Link>
          <p className="text-md md:text-xl font-bold text-primary ml-2">
            GAAP-UVCI
          </p>
        </div>
        <p className="font-bold uppercase text-md  tracking-wider">
          Projet de Soutenance - Licence DAS 2026
        </p>
      </aside>

      <nav className="grid grid-cols-1 grid-rows-2 md:flex md:flex-col md:justify-center gap-4 text-center md:text-left font-bold">
        <div className="flex justify-center md:justify-start items-center gap-3">
          <Mail className="w-6 h-6 text-white/80" />
          <p className="text-sm md:text-lg">
            <span className="font-black">Répondeur mail :</span>{" "}
            <a
              href="mailto:courrier@uvci.edu.ci"
              className="underline hover:text-white/80 transition-colors"
            >
              courrier@uvci.edu.ci
            </a>
          </p>
        </div>
        <div className="flex justify-center md:justify-start items-center gap-3">
          <Mailbox className="w-6 h-6 text-white/80" />
          <p className="text-sm md:text-lg">
            <span className="font-black">Boîte Postale :</span> 28 BP 536
            Abidjan 28 - Côte d'Ivoire
          </p>
        </div>
      </nav>

      <aside className="text-center md:text-right space-y-1">
        <p className="text-md md:text-xl opacity-80">
          Copyright © {new Date().getFullYear()}
        </p>
        <p className="text-sm md:text-sm font-medium">
          Université Virtuelle de Côte d'Ivoire
        </p>
      </aside>
    </footer>
  );
}
