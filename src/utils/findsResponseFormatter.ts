export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function formatPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  const skip = (page - 1) * limit;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      hasNext: skip + data.length < total,
      hasPrev: page > 1,
    } satisfies PaginationMeta,
  };
}
