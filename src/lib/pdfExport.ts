import { toast } from 'sonner';

export const exportHealthReportPDF = async (
  profile: any,
  waterIntake: number,
  waterGoal: number,
  streak: number,
  progress: number,
  isWatchConnected: boolean,
  watchData: any
) => {
  const tid = toast.loading("Đang tạo báo cáo Y khoa PDF...");
  try {
    const loadHtml2Pdf = async () => {
      if ((window as any).html2pdf) return (window as any).html2pdf;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const html2pdf = await loadHtml2Pdf() as any;
    const escapeHtml = (text: string) => String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));

    const reportDiv = document.createElement('div');
    reportDiv.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333; background: white;">
        <h1 style="color: #0ea5e9; text-align: center; margin-bottom: 5px;">BÁO CÁO SỨC KHỎE DIGIWELL</h1>
        <p style="text-align: center; color: #666; font-size: 14px;">Ngày xuất: ${escapeHtml(new Date().toLocaleDateString('vi-VN'))} - Thu thập bởi DigiCoach AI</p>
        <hr style="margin: 20px 0; border: 1px solid #eee;" />
        <h2 style="color: #0f172a; font-size: 18px;">1. Thông tin cá nhân</h2>
        <ul style="line-height: 1.8;"><li><strong>Họ và tên:</strong> ${escapeHtml(profile?.nickname || 'Khách')}</li><li><strong>Thể trạng:</strong> ${escapeHtml(profile?.age?.toString() || '--')} tuổi, ${escapeHtml(profile?.height?.toString() || '--')} cm, ${escapeHtml(profile?.weight?.toString() || '--')} kg</li></ul>
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">2. Thống kê nước (Hôm nay)</h2>
        <ul style="line-height: 1.8;"><li><strong>Đã uống:</strong> ${escapeHtml(waterIntake.toString())} ml / ${escapeHtml(waterGoal.toString())} ml</li><li><strong>Chuỗi hiện tại:</strong> ${escapeHtml(streak.toString())} ngày liên tiếp</li></ul>
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">3. Nhịp sinh học & Hoạt động</h2>
        <ul style="line-height: 1.8;"><li><strong>Nhịp tim gần nhất:</strong> ${escapeHtml(isWatchConnected ? (watchData?.heartRate?.toString() ?? '--') + ' BPM' : 'Chưa đồng bộ')}</li><li><strong>Số bước chân:</strong> ${escapeHtml(isWatchConnected ? (watchData?.steps?.toString() ?? '--') : 'Chưa đồng bộ')}</li></ul>
      </div>
    `;

    const opt = { margin: 1, filename: 'DigiWell_Report_' + new Date().toISOString().slice(0,10) + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    await html2pdf().set(opt).from(reportDiv).save();
    
    toast.success("Đã tải xuống báo cáo PDF thành công!", { id: tid });
  } catch {
    toast.error("Có lỗi xảy ra khi tạo PDF!", { id: tid });
  }
};