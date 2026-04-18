import { useState } from 'react';
import { toast } from 'sonner';
import { getWeatherData, type WeatherData } from '../lib/weatherEngine';

export function useWeatherSync() {
  const [isWeatherSynced, setIsWeatherSynced] = useState(false);
  // Khởi tạo state với kiểu WeatherData | null
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Hàm syncWeather giờ sẽ nhận city từ profile
  const syncWeather = async (city: string | undefined) => {
    if (!city) {
      toast.error("Chưa có thông tin thành phố để lấy dữ liệu thời tiết.");
      return;
    }

    const tid = toast.loading("Đang đồng bộ trạm thời tiết...");
    try {
      const data = await getWeatherData(city);
      if (!data) throw new Error("Không nhận được dữ liệu thời tiết.");
      setWeatherData(data);
      setIsWeatherSynced(true); // Đánh dấu đã đồng bộ
      toast.success(`Thời tiết tại ${city} đã cập nhật: ${data.temp}°C`, { id: tid });
    } catch (err) {
      toast.error("Không thể kết nối trạm thời tiết!", { id: tid });
    }
  };

  return { isWeatherSynced, setIsWeatherSynced, weatherData, syncWeather };
}