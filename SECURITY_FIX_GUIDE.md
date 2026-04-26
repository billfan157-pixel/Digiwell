# 🔒 HƯỚNG DẪN SỬA LỖI BẢO MẬT - QUAN TRỌNG!

## ⚠️ VẤN ĐỀ: File `.env` hoặc AI secret đã bị lộ

Chỉ xóa file khỏi nhánh hiện tại là chưa đủ. Nếu secret đã xuất hiện trong Git history, nó đã bị xâm phạm và phải được rotate ngay.

## 🚨 HÀNH ĐỘNG NGAY LẬP TỨC

### Bước 1: Rotate Groq key ngay

1. Vào Groq Console và thu hồi hoặc xóa key cũ.
2. Tạo key mới.
3. Chỉ lưu key mới ở server-side, không đưa vào `VITE_*` hay client bundle.

### Bước 2: Giữ AI secret ở server-side

```bash
supabase secrets set GROQ_API_KEY=<GROQ_KEY_MOI>
```

Frontend không cần `VITE_GROQ_API_KEY` nếu AI đi qua `supabase/functions/ai-gateway`.

### Bước 3: Bỏ `.env` khỏi index hiện tại nếu nó đang bị track

```bash
git rm --cached .env
```

### Bước 4: Xóa secret khỏi Git history

`git rm --cached` không xóa lịch sử cũ. Nếu secret từng được commit, cần rewrite history:

```bash
# Xóa toàn bộ file .env khỏi lịch sử
git filter-repo --path .env --invert-paths

# Nếu secret xuất hiện trong file khác, dùng replace-text
# Tạo file replacements.txt với dòng:
# <OLD_GROQ_KEY>==>REMOVED_GROQ_SECRET
git filter-repo --replace-text replacements.txt
```

Sau đó force-push lịch sử mới lên remote:

```bash
git push --force-with-lease --all
git push --force-with-lease --tags
```

### Bước 5: Cập nhật file `.env` local

```bash
# File .env (chỉ lưu local, không commit)
VITE_SUPABASE_URL=https://plbwqjdrivyffrhpbmvm.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

Không thêm `VITE_GROQ_API_KEY` vào đây.

### Bước 6: Kiểm tra `.gitignore`

```bash
git ls-files .env
```

Nếu lệnh trên không trả về gì thì `.env` không còn bị track.

## ✅ CHECKLIST XÁC NHẬN

- [ ] Đã rotate Groq API key
- [ ] Đã cấu hình `GROQ_API_KEY` trong Supabase secrets
- [ ] Đã chạy `git rm --cached .env` nếu file từng bị track
- [ ] Đã rewrite Git history nếu secret từng được commit
- [ ] Đã force-push lịch sử mới lên remote
- [ ] Đã cập nhật `.env` local chỉ với public client config
- [ ] Đã test app với key mới
- [ ] Đã xác nhận `.env` không còn bị track bởi git

## 🔐 BẢO MẬT CHO TƯƠNG LAI

1. **KHÔNG BAO GIỜ** commit file `.env` vào Git.
2. **LUÔN LUÔN** dùng `.env.example` làm template không chứa secret thật.
3. **THƯỜNG XUYÊN** rotate API key nếu có dấu hiệu lộ lọt.
4. **GIỮ** AI secrets ở server-side functions, không đưa vào `VITE_*`.

### Cho production build

```bash
# Build với public client env
VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx npm run build
```

## 📞 Cần Trợ Giúp?

1. Kiểm tra Groq usage/logs xem key cũ có bị lạm dụng không.
2. Kiểm tra Supabase Edge Function logs.
3. Nếu remote hoặc fork đã mirror secret, đảm bảo mọi remote liên quan cũng được dọn lịch sử.

---

**LƯU Ý**: Rewrite history sẽ thay đổi SHA commit. Tất cả clone và fork cần đồng bộ lại sau khi force-push.
