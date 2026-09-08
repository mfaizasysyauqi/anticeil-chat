// Prompt Tes Alur Timeline — AI Assistant (Full Flow)

const testPrompt = `
=== ALUR TESTING TIMELINE ===

1. USER: "Buat laporan teknis proyek anticeil"
2. STREAMING: isStreaming=true (timeline auto-expand)
3. ASSISTANT Selesai: isStreaming=false (timeline auto-collapse)

4. USER EDIT: klik Edit → editContent="Buat laporan teknis proyek anticeil V2"
5. AUDIT LOG: [Edit Prompt] · #msg_01 | Badge: [Edited]
6. TIMELINE: expand (isStreaming=false tapi ada edit event?)

7. USER DELETE: klik Delete → hapus semua respons setelah user message
8. AUDIT LOG: [Hapus] · #msg_02 | Badge: [Deleted · Undo 5s]
9. UNDO: klik Undo → restore messages
10. AUDIT LOG: [Undo] · #msg_02 | Badge: [Restored]

=== EXPECTED ===
- Badge muncul saat edit/delete/undo
- Timeline expand saat streaming, collapse saat idle
- Timeline tetap visible (tidak hilang) tapi ringkas saat collapsed
`;

export default testPrompt;
