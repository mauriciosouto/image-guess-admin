export type CardDTO = {
  id: string;
  name: string;
  imageUrl: string;
  /** Persisted when the datasource supplies it (e.g. FAB set). */
  setLabel?: string | null;
};

/** Declarative filter UI + validation; each plugin defines its own fields. */
export type LoadFilterSelect = {
  kind: "select";
  id: string;
  label: string;
  description?: string;
  required: boolean;
  options: Array<{ value: string; label: string }>;
};

export type LoadFilterField = LoadFilterSelect;

export interface DataSourcePlugin {
  id: string;
  name: string;
  /**
   * When set, the admin UI shows these controls and the load API validates them.
   * Sources without filters can omit this and use `loadCards({})` only.
   */
  describeLoadFilters?: () => LoadFilterField[] | Promise<LoadFilterField[]>;
  loadCards(filters: Record<string, string>): Promise<CardDTO[]>;
}
