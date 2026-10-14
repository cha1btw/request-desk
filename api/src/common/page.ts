// What a paginated list endpoint returns.
export interface Page<T> {
  items: T[];
  total: number; // all matching rows, not just this page
  page: number; // 1-based
  pageSize: number;
}
