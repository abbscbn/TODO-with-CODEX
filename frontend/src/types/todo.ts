export interface Todo {
  id: number
  title: string
  completed: boolean
}

export interface TodoRequest {
  title: string
  completed: boolean
}

export interface ApiProblem {
  status?: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}

export type TodoFilter = 'all' | 'active' | 'completed'
