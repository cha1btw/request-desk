// Shapes of the JSON the API returns. Kept by hand, in sync with the backend entities.

export type Role = 'admin' | 'manager'

export type RequestStatus = 'new' | 'in_progress' | 'done'

export interface User {
  id: number
  email: string
  name: string
  role: Role
}

// What GET /users returns (admin only): the same as User plus the creation time.
export interface AdminUser extends User {
  createdAt: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface Client {
  id: number
  name: string
  email: string
  phone: string
  createdAt: string
}

export interface RequestComment {
  id: number
  text: string
  requestId: number
  authorId: number
  author: User
  createdAt: string
}

// What a paginated list endpoint returns.
export interface Page<T> {
  items: T[]
  total: number // all matching rows, not just this page
  page: number // 1-based
  pageSize: number
}

export interface CustomerRequest {
  id: number
  title: string
  description: string
  status: RequestStatus
  clientId: number
  client: Client
  // Only present on the detail endpoint (GET /requests/:id)
  comments?: RequestComment[]
  createdAt: string
  updatedAt: string
}
