"use client";

import { useQuery } from "@tanstack/react-query";

import { getAvailableEmployees } from "@/actions/get-available-employees";
import { queryKeys } from "@/constants/query-keys";

export const useGetAvailableEmployees = ({
  barbershopId,
  dateTime,
}: {
  barbershopId: string;
  dateTime?: Date;
}) => {
  return useQuery({
    queryKey: queryKeys.getAvailableEmployees(barbershopId, dateTime),
    queryFn: async () => {
      try {
        const result = await getAvailableEmployees({
          barbershopId,
          dateTime: dateTime!,
        });
        
        
        // Se houver erro, retorna arrays vazios
        if (!result.data) {
          console.error("Erro ao buscar barbeiros - sem data:", result);
          return { available: [], unavailable: [] };
        }
        
        return result.data;
      } catch (error) {
        console.error("Erro ao chamar getAvailableEmployees:", error);
        return { available: [], unavailable: [] };
      }
    },
    enabled: Boolean(dateTime),
  });
};
