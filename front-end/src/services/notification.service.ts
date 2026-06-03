/**
 * notification.service.ts — Service de notifications aux enseignants
 *
 * Ce service permet d'envoyer une notification (e-mail ou alerte interne)
 * à tous les enseignants qui ont dépassé leur quota annuel d'heures
 * complémentaires.
 *
 * Utilisé par l'administrateur depuis le tableau de bord,
 * dans le panneau des dépassements critiques.
 */
import api from "../api/axios";

export const notificationService = {
  /**
   * Déclenche l'envoi de notifications à tous les enseignants
   * dont le volume horaire calculé dépasse le quota de leur grade.
   * Le serveur traite la liste et envoie les alertes.
   */
  notifyExceedingTeachers: async (): Promise<unknown> => {
    const response = await api.post("/notifications/notify-exceeding");
    return response.data;
  },
};
