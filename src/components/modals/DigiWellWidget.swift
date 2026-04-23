import WidgetKit
import SwiftUI

// Lấy mã màu Hex truyền từ React
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue:  Double(b) / 255, opacity: Double(a) / 255)
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), waterToday: 1250, waterGoal: 2000, themeColor: "#06b6d4")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(SimpleEntry(date: Date(), waterToday: 1250, waterGoal: 2000, themeColor: "#06b6d4"))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // ĐỌC DỮ LIỆU TỪ APP GROUP (Cầu nối giữa React và Native)
        let defaults = UserDefaults(suiteName: "group.com.vlu.digiwell")
        let waterToday = defaults?.integer(forKey: "water_today") ?? 0
        let waterGoal = defaults?.integer(forKey: "water_goal") ?? 2000
        let themeColor = defaults?.string(forKey: "themeColor") ?? "#06b6d4"
        
        let entry = SimpleEntry(date: Date(), waterToday: waterToday, waterGoal: waterGoal, themeColor: themeColor)
        let timeline = Timeline(entries: [entry], policy: .never) // Policy never vì ta sẽ gọi reload từ React
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let waterToday: Int
    let waterGoal: Int
    let themeColor: String
}

struct DigiWellWidgetEntryView : View {
    var entry: Provider.Entry
    
    var body: some View {
        let theme = Color(hex: entry.themeColor)
        let progress = min(Double(entry.waterToday) / Double(max(entry.waterGoal, 1)), 1.0)
        
        ZStack {
            // Nền Dark Mode
            Color(red: 15/255, green: 23/255, blue: 42/255).edgesIgnoringSafeArea(.all)
            
            // Ánh sáng Glow mờ ảo góc trên
            GeometryReader { geometry in
                Circle()
                    .fill(theme.opacity(0.3))
                    .blur(radius: 30)
                    .frame(width: 150, height: 150)
                    .position(x: geometry.size.width, y: 0)
            }
            
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Hôm nay")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(theme)
                        Text("\(entry.waterToday)")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(.white)
                        Text("/ \(entry.waterGoal) ml")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))
                    }
                    Spacer()
                    Image(systemName: "drop.fill")
                        .foregroundColor(theme)
                        .font(.system(size: 20))
                }
                
                Spacer()
                
                // Thanh Progress Bar
                GeometryReader { metrics in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.white.opacity(0.1))
                            .frame(height: 8)
                        
                        RoundedRectangle(cornerRadius: 10)
                            .fill(theme)
                            .frame(width: metrics.size.width * CGFloat(progress), height: 8)
                    }
                }.frame(height: 8)
            }
            .padding()
        }
        // Gắn URL Scheme để bấm vào là gọi app mở lên ngay lập tức
        .widgetURL(URL(string: "digiwell://widget-tap"))
    }
}

@main
struct DigiWellWidget: Widget {
    let kind: String = "DigiWellWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DigiWellWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("DigiWell Tracking")
        .description("Theo dõi lượng nước ngay trên màn hình chính.")
        .supportedFamilies([.systemSmall])
    }
}