import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_BASE = `Bạn là CodeShare AI - trợ lý code tiếng Việt thân thiện cho cộng đồng lập trình viên Việt Nam.
QUY TẮC:
- Trả lời 100% bằng TIẾNG VIỆT, kể cả comment trong code.
- Dùng markdown: **bold**, code blocks với syntax language (\`\`\`js, \`\`\`py, \`\`\`html...).
- Ngắn gọn, dễ hiểu, dùng emoji vừa phải (✅ ❌ 💡 🐛 ⚡).
- Tự nhận diện ngôn ngữ code (JS/TS/Python/C++/HTML/CSS/PHP...).
- Nếu code có vấn đề bảo mật, performance, hoặc bug ẩn → cảnh báo.
- Không bịa thư viện không tồn tại.

KIẾN THỨC NỀN (CodeShare context):
- Người dùng thường là dev VN, hay viết web bán hàng, web game, blog truyện tranh.
- Họ dùng React, HTML/CSS/JS thuần, PHP, Python, Node.js là phổ biến.
- Hay gặp lỗi: CORS, async/await sai, state React stale, regex sai, SQL injection.
- Khuyến khích code sạch, dùng const/let thay var, dùng async/await thay callback.`;

const MODE_PROMPTS: Record<string, string> = {
  explain: `Hãy GIẢI THÍCH đoạn code dưới đây cho người mới học hiểu:
1. **Tóm tắt 1 câu**: code làm gì.
2. **Phân tích từng phần** quan trọng (dùng bullet).
3. **Khái niệm** lập trình liên quan (nếu có).
4. **Ví dụ sử dụng** (nếu hợp lý).`,
  fix: `Hãy SỬA BUG cho đoạn code dưới đây:
1. **🐛 Lỗi gì?** - chỉ rõ chỗ sai và tại sao sai.
2. **✅ Code đã sửa** - paste full code đã fix trong code block.
3. **💡 Giải thích** ngắn cách sửa.
Nếu không thấy lỗi rõ ràng, đoán các bug tiềm ẩn.`,
  optimize: `Hãy TỐI ƯU đoạn code dưới đây:
1. **⚡ Vấn đề hiện tại** - chỗ nào chậm/dư thừa/khó đọc.
2. **✨ Code tối ưu** - paste full code mới trong code block.
3. **📊 Lợi ích** - nhanh hơn bao nhiêu, sạch hơn ra sao, dễ maintain hơn ra sao.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, code } = await req.json();
    if (!mode || !code) {
      return new Response(JSON.stringify({ error: "Thiếu mode hoặc code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof code !== "string" || code.length > 5000) {
      return new Response(JSON.stringify({ error: "Code quá dài (tối đa 5000 ký tự)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const promptInstr = MODE_PROMPTS[mode];
    if (!promptInstr) {
      return new Response(JSON.stringify({ error: "Mode không hợp lệ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: `${promptInstr}\n\n\`\`\`\n${code}\n\`\`\`` },
        ],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Quá nhiều request, thử lại sau ít phút." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Hết credit AI, vui lòng nạp thêm vào workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error:", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway lỗi" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await r.json();
    const result = json?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("ai-code-assistant error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Lỗi không xác định" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});