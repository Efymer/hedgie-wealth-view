import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NetWorthData {
  date: string;
  value: number;
  change: number;
}

export const useNetWorthData = (userId?: string) => {
  return useQuery({
    queryKey: ["net-worth-data", userId],
    queryFn: async (): Promise<NetWorthData[]> => {
      const { data, error } = await supabase
        .from("net_worth_data")
        .select("date, value, change")
        .order("date", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch net worth data: ${error.message}`);
      }

      return (data || []).map(item => ({
        date: item.date,
        value: Number(item.value),
        change: Number(item.change)
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};