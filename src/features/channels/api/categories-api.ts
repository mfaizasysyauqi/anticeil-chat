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
  return [
    { id: `cat_text_${colonyId}`, colonyId, name: 'TEXT CHANNELS', isDefault: true },
    { id: `cat_voice_${colonyId}`, colonyId, name: 'VOICE CHANNELS', isDefault: true },
    { id: `cat_forum_${colonyId}`, colonyId, name: 'FORUM CHANNELS', isDefault: true },
    { id: `cat_kanban_${colonyId}`, colonyId, name: 'KANBAN BOARDS', isDefault: true },
  ];
}

export function loadStoredColonyCategories(colonyId?: string): ColonyCategory[] {
  try {
    if (typeof window === 'undefined') return [];
    const deletedIds = new Set(loadDeletedCategoryIds());

    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const customList: ColonyCategory[] = raw ? JSON.parse(raw) : [];
    const safeCustom = Array.isArray(customList) ? customList.filter((c) => !deletedIds.has(c.id)) : [];

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

export const categoriesApi = {
  getCategories: loadStoredColonyCategories,
  createCategory(colonyId: string, name: string): ColonyCategory {
    const newCat: ColonyCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      name: name.trim().toUpperCase(),
    };
    saveStoredColonyCategory(newCat);
    return newCat;
  },
  updateCategory(category: ColonyCategory): void {
    saveStoredColonyCategory(category);
  },
  deleteCategory: deleteStoredColonyCategory,
};
