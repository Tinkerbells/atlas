import { useFsStore } from "../stores/fs-store";

export function useFileSelection() {
  const store = useFsStore();

  function select(name: string, multi: boolean = false) {
    store.select(name, multi);
  }

  function selectAll() {
    store.selectAll();
  }

  function clearSelection() {
    store.clearSelection();
  }

  function isSelected(name: string): boolean {
    return store.selectedNames.has(name);
  }

  return {
    select,
    selectAll,
    clearSelection,
    isSelected,
    selectedNames: store.selectedNames,
    selectedEntries: store.selectedEntries,
  };
}
