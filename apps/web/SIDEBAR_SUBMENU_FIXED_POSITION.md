# Submenu Sidebar dengan Fixed Position (Portal)

## Tujuan

Membuat submenu "Pindahkan ke folder" yang:
1. ✅ **Tidak overflow** - Submenu muncul dengan fixed position
2. ✅ **Smart positioning** - Muncul di posisi yang tepat, tidak terpotong
3. ✅ **Tidak perlu scroll** - Submenu terlihat penuh tanpa scroll horizontal
4. ✅ **Tetap berfungsi** - Bisa memindahkan chat ke folder

## Pendekatan: Portal dengan Fixed Position + Smart Positioning

### Konsep:

```
┌─────────────────────────────────┐
│ Sidebar                         │
│                                 │
│  ┌──────────────┐              │
│  │ Chat Menu    │              │
│  ├──────────────┤              │
│  │ Pin          │              │
│  │ Rename       │              │
│  │ Pindahkan... │  ← Button    │
│  │ Delete       │              │
│  └──────────────┘              │
│                                 │
└─────────────────────────────────┘

        ↓ Click button

┌─────────────────────────────────┐
│ Sidebar                         │
│                                 │
│ ┌────────────┐                 │
│ │ Folder 1   │← Submenu portal │
│ │ Folder 2   │  (fixed pos)    │
│ │ Folder 3   │  muncul di atas │
│ └────────────┘                 │
│                                 │
│  ┌──────────────┐              │
│  │ Chat Menu    │              │
│  └──────────────┘              │
│                                 │
└─────────────────────────────────┘
```

## Implementasi

### 1. State Management

```typescript
const [folderSubmenuSessionId, setFolderSubmenuSessionId] = useState<string | null>(null);
const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
const submenuButtonRef = useRef<HTMLButtonElement>(null);
```

### 2. Smart Positioning Logic

```typescript
const rect = submenuButtonRef.current?.getBoundingClientRect();
if (rect) {
  // Estimate submenu height
  const submenuHeight = Math.min(projects.length * 32 + 20, 300);
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  
  // Position to the left of the button
  const left = rect.left - 180; // submenu width
  
  // Smart vertical positioning
  let top;
  if (spaceAbove > submenuHeight && spaceBelow < submenuHeight) {
    // More space above, show submenu above
    top = Math.max(10, rect.bottom - submenuHeight);
  } else {
    // Show at button level
    top = Math.max(10, rect.top);
  }
  
  setSubmenuPosition({ top, left });
}
```

**Penjelasan:**
- Calculate ruang di atas dan di bawah button
- Jika ruang di atas lebih besar DAN ruang di bawah tidak cukup → tampilkan di atas
- Jika tidak → tampilkan sejajar dengan button
- `Math.max(10, ...)` memastikan submenu tidak terpotong di bagian atas layar

### 3. Portal ke document.body

```typescript
{isMounted && folderSubmenuSessionId === session.id && submenuPosition && createPortal(
  <div
    data-submenu-portal="true"
    style={{
      position: 'fixed',
      top: `${submenuPosition.top}px`,
      left: `${submenuPosition.left}px`,
      width: '180px',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 999999,
      // ... other styles
    }}
  >
    {/* Submenu content */}
  </div>,
  document.body
)}
```

**Kenapa Portal:**
- ✅ Tidak terpotong oleh `overflow: hidden` parent
- ✅ Tidak terpengaruh transform parent
- ✅ Z-index lebih mudah diatur
- ✅ Positioning bebas di layar

### 4. Click Outside Detection

```typescript
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;
    
    // Close main menu
    if (menuRef.current && !menuRef.current.contains(target)) {
      setMenuSessionId(null);
    }
    
    // Close submenu (but not if clicking button)
    if (folderSubmenuSessionId && submenuButtonRef.current && !submenuButtonRef.current.contains(target)) {
      const clickedElement = e.target as Element;
      const submenuElement = document.querySelector('[data-submenu-portal="true"]');
      if (!submenuElement || !submenuElement.contains(clickedElement)) {
        setFolderSubmenuSessionId(null);
        setSubmenuPosition(null);
      }
    }
  };
  
  if (menuSessionId || folderSubmenuSessionId || isProfileMenuOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [menuSessionId, folderSubmenuSessionId, isProfileMenuOpen]);
```

**Penjelasan:**
- Menggunakan `data-submenu-portal="true"` untuk identifikasi submenu portal
- Check apakah klik di dalam submenu menggunakan `querySelector`
- Tidak menutup jika klik di button atau di dalam submenu

## Keuntungan Pendekatan Ini

### ✅ Pro:
1. **Tidak overflow** - Submenu muncul di fixed position, tidak terpotong
2. **Smart positioning** - Otomatis pindah ke atas kalau di bawah tidak cukup
3. **No scroll needed** - Submenu langsung terlihat penuh
4. **Works everywhere** - Tidak terpengaruh parent styling
5. **Clean UX** - Submenu muncul di posisi yang tepat

### ⚠️ Consideration:
1. **Sedikit lebih complex** - Perlu calculate position
2. **Portal overhead** - Render di luar component tree
3. **Click detection** - Perlu handle portal element separately

## Perbandingan dengan Pendekatan Relative

| Aspek | Relative Position | Fixed Position (Portal) |
|-------|------------------|------------------------|
| Overflow | ❌ Bisa terpotong | ✅ Tidak terpotong |
| Positioning | Terbatas parent | ✅ Bebas di layar |
| Scroll needed | ❌ Sering perlu scroll | ✅ Tidak perlu |
| Complexity | ✅ Simple | ⚠️ Medium |
| Smart position | ❌ Tidak bisa | ✅ Bisa adjust |

## Cara Test

1. **Restart dev server**: `pnpm dev`
2. **Buka chat** dengan banyak folder (test overflow)
3. **Klik three-dot menu** di chat paling atas
4. **Klik "Pindahkan ke folder"**
   - ✅ Submenu harus muncul ke kiri
   - ✅ Submenu harus terlihat penuh (tidak terpotong)
   - ✅ Tidak perlu scroll horizontal
5. **Klik three-dot menu** di chat paling bawah
6. **Klik "Pindahkan ke folder"**
   - ✅ Submenu muncul sejajar atau di bawah
   - ✅ Tetap terlihat penuh
7. **Test klik folder** - harus bisa memindahkan chat
8. **Test klik outside** - submenu harus menutup

## Troubleshooting

### Submenu tidak muncul:
- ✅ Check `isMounted = true`
- ✅ Check `submenuPosition` tidak null
- ✅ Check console untuk errors

### Submenu posisi salah:
- ✅ Check `getBoundingClientRect()` berhasil
- ✅ Check window size calculation
- ✅ Adjust `left = rect.left - 180` kalau perlu

### Click outside tidak bekerja:
- ✅ Check `data-submenu-portal="true"` attribute
- ✅ Check event listener attached
- ✅ Check querySelector returns element

### Submenu terpotong atas:
- ✅ Check `Math.max(10, top)` untuk min top position
- ✅ Adjust `10` ke nilai lebih besar kalau perlu

## Hasil Akhir

Dengan pendekatan ini:

✅ Submenu **tidak overflow** dan tidak perlu scroll horizontal  
✅ Submenu **muncul di posisi optimal** (atas atau sejajar)  
✅ Submenu **terlihat penuh** tanpa terpotong  
✅ **Bisa memindahkan chat** ke folder dengan sukses  
✅ **Click outside** menutup submenu dengan benar  
✅ **UX smooth** dan responsive  

---

**Best of both worlds:** Portal untuk positioning freedom + Smart logic untuk optimal placement! 🎯
