import { api } from '@/lib/api';

export interface ColonyCategory {
  id: string;
  colonyId: string;
  name: string;
  isDefault?: boolean;
}

const STORAGE_KEY_CATEGORIES = 'anticeil_colony_categories_v1';
const STORAGE_KEY_DELETED = 'anticeil_deleted_categories_v1';

export function loadDeletedCategoryIds(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function markCategoryDeleted(categoryId: string): void {
  try {
    const list = loadDeletedCategoryIds();
    if (!list.includes(categoryId)) {
      list.push(categoryId);
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Failed to mark category deleted', err);
  }
}

export function getDefaultCategories(colonyId: string): ColonyCategory[] {
  if (colonyId === 'colony_cyberpunk') {
    return [
      { id: `cat_announcements_${colonyId}`, colonyId, name: 'PENGUMUMAN RESMI', isDefault: true },
      { id: `cat_text_${colonyId}`, colonyId, name: 'SALURAN TEKS', isDefault: true },
      { id: `cat_voice_${colonyId}`, colonyId, name: 'RUANG SUARA & VIDEO', isDefault: true },
      { id: `cat_activities_${colonyId}`, colonyId, name: 'AKTIVITAS & MINI-APPS', isDefault: true },
      { id: `cat_forum_${colonyId}`, colonyId, name: 'FORUM & DISKUSI', isDefault: true },
    ];
  }
  return [
    { id: `cat_text_${colonyId}`, colonyId, name: 'TEXT CHANNELS', isDefault: true },
    { id: `cat_voice_${colonyId}`, colonyId, name: 'VOICE CHANNELS', isDefault: true },
  ];
}

export function loadStoredColonyCategories(colonyId?: string): ColonyCategory[] {
  try {
    if (typeof window === 'undefined') return [];
    const deletedIds = new Set(loadDeletedCategoryIds());

    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const customList: ColonyCategory[] = raw ? JSON.parse(raw) : [];
    const safeCustom = Array.isArray(customList)
      ? customList.filter(
          (c) =>
            !deletedIds.has(c.id) &&
            !c.id.startsWith('cat_forum_') &&
            !c.id.startsWith('cat_kanban_')
        )
      : [];

    if (!colonyId) {
      return safeCustom;
    }

    const colonyDefaults = getDefaultCategories(colonyId).filter(
      (d) => !deletedIds.has(d.id) && !safeCustom.some((c) => c.id === d.id)
    );

    const colonyCustom = safeCustom.filter((c) => c.colonyId === colonyId);
    return [...colonyDefaults, ...colonyCustom];
  } catch {
    return [];
  }
}

export function saveStoredColonyCategory(category: ColonyCategory): void {
  try {
    // If it was marked deleted previously, unmark it
    const deleted = loadDeletedCategoryIds().filter((id) => id !== category.id);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deleted));

    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const all: ColonyCategory[] = raw ? JSON.parse(raw) : [];
    const updated = [...all.filter((c) => c.id !== category.id), category];
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('anticeil_categories_changed', { detail: category.colonyId }));
  } catch (err) {
    console.error('Failed to save category to storage', err);
  }
}

export function deleteStoredColonyCategory(categoryId: string, colonyId: string): void {
  try {
    markCategoryDeleted(categoryId);
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const all: ColonyCategory[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter((c) => c.id !== categoryId);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('anticeil_categories_changed', { detail: colonyId }));
  } catch (err) {
    console.error('Failed to delete category from storage', err);
  }
}

// Background sync with fullstack backend
const syncedColonies = new Set<string>();

export const categoriesApi = {
  getCategories: (colonyId?: string): ColonyCategory[] => {
    if (colonyId && !syncedColonies.has(colonyId)) {
      syncedColonies.add(colonyId);
      api
        .get<ColonyCategory[]>('/v1/colony/categories', { params: { colonyId } })
        .then((remoteCats) => {
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            const colonyRemote = remoteCats.map((c) => ({ ...c, colonyId: c.colonyId || colonyId })).filter((c) => c.colonyId === colonyId);
            const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
            const currentList: ColonyCategory[] = raw ? JSON.parse(raw) : [];
            const otherColonies = currentList.filter((c) => c.colonyId !== colonyId);
            const merged = [...otherColonies, ...colonyRemote];
            localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('anticeil_categories_changed', { detail: colonyId }));
          }
        })
        .catch(() => {});
    }
    return loadStoredColonyCategories(colonyId);
  },

  async fetchCategoriesRemote(colonyId: string): Promise<ColonyCategory[]> {
    try {
      const res = await api.get<ColonyCategory[]>('/v1/colony/categories', { params: { colonyId } });
      if (Array.isArray(res)) {
        const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
        const currentList: ColonyCategory[] = raw ? JSON.parse(raw) : [];
        const otherColonies = currentList.filter((c) => c.colonyId !== colonyId);
        const merged = [...otherColonies, ...res];
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('anticeil_categories_changed', { detail: colonyId }));
        return res;
      }
    } catch {}
    return loadStoredColonyCategories(colonyId);
  },

  createCategory(colonyId: string, name: string): ColonyCategory {
    const newCat: ColonyCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      name: name.trim().toUpperCase(),
    };
    saveStoredColonyCategory(newCat);
    // Fire-and-forget sync to fullstack backend
    api.post('/v1/colony/categories', newCat).catch((err) => console.warn('Failed to sync category to backend', err));
    return newCat;
  },

  updateCategory(category: ColonyCategory): void {
    saveStoredColonyCategory(category);
    // Fire-and-forget sync to fullstack backend
    api.put(`/v1/colony/categories/${category.id}`, category).catch((err) => console.warn('Failed to sync updated category to backend', err));
  },

  deleteCategory(categoryId: string, colonyId: string): void {
    deleteStoredColonyCategory(categoryId, colonyId);
    // Fire-and-forget sync to fullstack backend
    api.delete(`/v1/colony/categories/${categoryId}`).catch((err) => console.warn('Failed to sync deleted category to backend', err));
  },
};
