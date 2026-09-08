# AIChatBubble - Reusable AI Chat Component

Komponen reusable untuk AI Co-Author dan AI Assistant dengan bubble prompt styling yang konsisten.

## 🎯 Fitur

- ✅ **Unified Styling** - Style bubble yang sama untuk Co-Author dan Assistant
- ✅ **Theme Aware** - Otomatis adapt ke light/dark mode
- ✅ **Expandable Prompts** - Prompt panjang bisa di-expand/collapse
- ✅ **Edit & Undo** - Support edit dan undo (Co-Author variant)
- ✅ **Streaming Support** - Animated indicator saat generating
- ✅ **Action Bar** - Copy, edit, feedback, undo buttons (hover visible)
- ✅ **Attachments** - Preview file attachments
- ✅ **Custom Icons** - Flexible assistant icons dan colors
- ✅ **Reasoning Display** - Tampilkan thinking/reasoning content

## 📦 Import

```tsx
import {
  AIChatBubble,
  UserPromptBubble,
  AssistantMessageBubble,
  CoAuthorMessageBubble,
} from '@/shared/components/AIChatBubble';
```

## 🚀 Usage

### 1. Basic User Message

```tsx
<AIChatBubble
  role="user"
  content="Buatkan function untuk sorting array"
  language="id"
  timestamp={Date.now()}
  onCopy={() => navigator.clipboard.writeText(content)}
/>
```

### 2. Assistant Message (AI Assistant)

```tsx
<AIChatBubble
  role="assistant"
  content="Berikut adalah function sorting..."
  assistantName="AI Assistant"
  assistantIcon={<Bot size={11} />}
  assistantColor="var(--brand-primary)"
  timestamp={Date.now()}
  language="id"
  onCopy={handleCopy}
/>
```

### 3. Co-Author Style (dengan Edit & Undo)

```tsx
<AIChatBubble
  role="user"
  content="Tambahkan error handling"
  variant="coauthor"
  isReverted={false}
  timestamp={Date.now()}
  language="id"
  onEdit={handleEdit}
  onUndo={handleUndo}
  onCopy={handleCopy}
/>
```

### 4. Streaming Message

```tsx
<AIChatBubble
  role="assistant"
  content=""
  isStreaming={true}
  assistantName="AI Co-Author"
  language="id"
/>
```

### 5. With Reasoning/Thinking

```tsx
<AIChatBubble
  role="assistant"
  content="Saya akan membuat..."
  reasoningContent="Analyzing the request... Planning the implementation..."
  assistantName="AI Assistant"
  language="id"
/>
```

### 6. With Attachments

```tsx
<AIChatBubble
  role="user"
  content="Analyze this code"
  attachments={[
    {
      id: '1',
      name: 'example.ts',
      type: 'text/typescript',
      size: 2048,
      isImage: false,
    }
  ]}
  language="id"
/>
```

### 7. Edit Mode

```tsx
const [isEditing, setIsEditing] = useState(false);
const [editContent, setEditContent] = useState('');

<AIChatBubble
  role="user"
  content={originalContent}
  isEditing={isEditing}
  editContent={editContent}
  variant="assistant"
  language="id"
  onEdit={() => {
    setEditContent(originalContent);
    setIsEditing(true);
  }}
  onSaveEdit={(newContent) => {
    // Save logic
    setIsEditing(false);
  }}
  onCancelEdit={() => setIsEditing(false)}
/>
```

## 🎨 Convenience Components

### UserPromptBubble

Simplified wrapper untuk user messages:

```tsx
<UserPromptBubble
  content="Hello AI!"
  variant="assistant"
  language="id"
  onCopy={handleCopy}
  onEdit={handleEdit}
/>
```

### AssistantMessageBubble

Simplified wrapper untuk assistant messages:

```tsx
<AssistantMessageBubble
  content="Hello! How can I help?"
  assistantName="AI Assistant"
  assistantColor="var(--brand-primary)"
  language="id"
  onCopy={handleCopy}
/>
```

### CoAuthorMessageBubble

Simplified wrapper untuk Co-Author style:

```tsx
<CoAuthorMessageBubble
  content="Add error handling"
  isReverted={false}
  language="id"
  onCopy={handleCopy}
  onUndo={handleUndo}
/>
```

## 🔧 Props Reference

### AIChatBubbleProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `'user' \| 'assistant'` | required | Message role |
| `content` | `string` | required | Message content |
| `reasoningContent` | `string?` | - | Thinking/reasoning content |
| `isStreaming` | `boolean?` | `false` | Is currently streaming |
| `assistantName` | `string?` | `'AI'` | Assistant display name |
| `assistantIcon` | `ReactNode?` | - | Custom assistant icon |
| `assistantColor` | `string?` | `'var(--brand-primary)'` | Assistant brand color |
| `language` | `'id' \| 'en'?` | `'id'` | Interface language |
| `timestamp` | `number?` | - | Message timestamp |
| `variant` | `'coauthor' \| 'assistant'?` | `'assistant'` | Message variant style |
| `isEditing` | `boolean?` | `false` | Is in edit mode |
| `editContent` | `string?` | `''` | Edit textarea value |
| `isReverted` | `boolean?` | `false` | Has been undone |
| `attachments` | `Attachment[]?` | - | File attachments |
| `onCopy` | `() => void?` | - | Copy callback |
| `onEdit` | `() => void?` | - | Edit button callback |
| `onSaveEdit` | `(newContent: string) => void?` | - | Save edit callback |
| `onCancelEdit` | `() => void?` | - | Cancel edit callback |
| `onUndo` | `() => void?` | - | Undo callback |
| `onResend` | `() => void?` | - | Resend callback |
| `extraHeader` | `ReactNode?` | - | Custom header content |
| `extraContent` | `ReactNode?` | - | Custom content |
| `extraFooter` | `ReactNode?` | - | Custom footer content |

### Attachment Type

```tsx
interface Attachment {
  id: string;
  name: string;
  type?: string;
  size?: number;
  isImage?: boolean;
  content?: string;
}
```

## 🎭 Variants

### `assistant` (default)
- Standard AI Assistant style
- Shows copy and feedback buttons
- No edit/undo buttons
- Suitable untuk general chat

### `coauthor`
- Co-Author style dengan edit/undo
- Shows edit and undo buttons
- Expandable long prompts
- Suitable untuk document editing

## 🎨 Styling

Komponen menggunakan CSS variables untuk theming:

```css
/* Colors */
--brand-primary
--text-primary
--text-secondary
--text-muted
--bg-user-bubble
--bg-subtle
--bg-surface
--border-subtle
--border-strong
--accent-success
--accent-danger

/* Spacing */
--radius-sm
--radius-md
--radius-xl

/* Shadows */
--shadow-sm
```

## 📝 Migration Guide

### From StudioChatMessage to AIChatBubble

**Before:**
```tsx
<StudioChatMessage
  role="user"
  content={msg.content}
  assistantName="AI Co-Author"
  language={language}
  onEdit={handleEdit}
  onUndo={handleUndo}
/>
```

**After:**
```tsx
<AIChatBubble
  role="user"
  content={msg.content}
  variant="coauthor"
  language={language}
  onEdit={handleEdit}
  onUndo={handleUndo}
/>
```

### From MessageBubble to AIChatBubble

**Before:**
```tsx
<MessageBubble message={msg} sessionId={sessionId} />
```

**After:**
```tsx
<AIChatBubble
  role={msg.role}
  content={msg.content}
  reasoningContent={msg.reasoningContent}
  assistantName="AI Assistant"
  timestamp={msg.timestamp}
  language={language}
  variant="assistant"
  onCopy={handleCopy}
/>
```

## ✨ Best Practices

1. **Always provide language** - untuk translations yang benar
2. **Use variants consistently** - `coauthor` untuk doc editing, `assistant` untuk chat
3. **Handle callbacks properly** - implement onCopy, onEdit, etc sesuai kebutuhan
4. **Provide timestamp** - untuk action bar time display
5. **Use convenience components** - `UserPromptBubble`, `AssistantMessageBubble` untuk kode lebih clean

## 🐛 Troubleshooting

### Bubble tidak muncul
- Pastikan sudah import component
- Cek `content` prop tidak kosong
- Verify CSS variables tersedia

### Edit mode tidak berfungsi
- Pastikan `isEditing` state managed dengan benar
- Implement `onSaveEdit` dan `onCancelEdit`
- Sync `editContent` dengan state

### Action buttons tidak muncul on hover
- Cek container memiliki `onMouseEnter/Leave`
- Verify `isHovered` state management
- Pastikan CSS transitions tidak di-override

## 📚 Examples

Lihat contoh lengkap implementasi di:
- `apps/web/src/features/docs/components/DocsCoAuthorSidebar.tsx` (Co-Author)
- `apps/web/src/features/chat/components/MessageList.tsx` (AI Assistant)
