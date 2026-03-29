import { useQuery } from '@tanstack/react-query';
import * as SettingsService from '../services/SettingsService';

/**
 * Hook để lấy public settings (không cần authentication)
 * Có thể sử dụng ở bất kỳ component nào để hiển thị thông tin website
 */
export const usePublicSettings = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => SettingsService.getSettingsPublic(),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    cacheTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    settings: data?.data || null,
    isLoading,
    error,
    refetch
  };
};

