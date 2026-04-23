import Foundation
import Capacitor
import WidgetKit

@objc(WidgetPlugin)
public class WidgetPlugin: CAPPlugin {
    @objc func syncData(_ call: CAPPluginCall) {
        let waterToday = call.getInt("water_today") ?? 0
        let waterGoal = call.getInt("water_goal") ?? 2000
        let themeColor = call.getString("themeColor") ?? "#06b6d4"

        // Lưu vào App Group (Vùng nhớ dùng chung với Widget)
        if let defaults = UserDefaults(suiteName: "group.com.vlu.digiwell") {
            defaults.set(waterToday, forKey: "water_today")
            defaults.set(waterGoal, forKey: "water_goal")
            defaults.set(themeColor, forKey: "themeColor")
            
            // Yêu cầu iOS vẽ lại Widget ngay lập tức
            if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
            call.resolve()
        } else {
            call.reject("Không tìm thấy App Group. Sếp đã bật App Groups trong Xcode chưa?")
        }
    }
}