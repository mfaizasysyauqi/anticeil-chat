export interface ColonyCategory {
  id: string;
  colonyId: string;
  name: string;
}

const STORAGE_KEY_CATEGORIES = 'anticeil_colony_categories_v1';

export function loadStoredColonyCategories(colonyId?: string): ColonyCategory[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) return [];
    const list: ColonyCategory[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return colonyId ? list.filter((c) => c.colonyId === colonyId) : list;
  } catch {
    return [];
  }
}

export function saveStoredColonyCategory(category: ColonyCategory): void {
  try {
    const all = loadStoredColonyCategories();
    const updated = [...all.filter((c) => c.id !== category.id), category];
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('anticeil_categories_changed', { detail: category.colonyId }));
  } catch (err) {
    console.error('Failed to save category to storage', err);
  }
}

export function deleteStoredColonyCategory(categoryId: string, colonyId: string): void {
  try {
    const all = loadStoredColonyCategories();
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
      name: name.trim(),
    };
    saveStoredColonyCategory(newCat);
    return newCat;
  },
  updateCategory(category: ColonyCategory): void {
    saveStoredColonyCategory(category);
  },
  deleteCategory: deleteStoredColonyCategory,
};

