import api from "../api/axios";

export const notificationService = {
  notifyExceedingTeachers: async (): Promise<any> => {
    const response = await api.post("/notifications/notify-exceeding");
    return response.data;
  },
};