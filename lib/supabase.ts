import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: 'scheduled' | 'in-progress' | 'completed'
          starttime: string
          scheduledstarttime: string | null
          scheduledendtime: string | null
          completedtime: string | null
          elapsedtime: number
        }
        Insert: {
          id: string
          title: string
          description: string
          status: 'scheduled' | 'in-progress' | 'completed'
          starttime: string
          scheduledstarttime?: string | null
          scheduledendtime?: string | null
          completedtime?: string | null
          elapsedtime?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'scheduled' | 'in-progress' | 'completed'
          starttime?: string
          scheduledstarttime?: string | null
          scheduledendtime?: string | null
          completedtime?: string | null
          elapsedtime?: number
        }
      }
      task_logs: {
        Row: {
          id: string
          taskid: string
          message: string
          timestamp: string
          iseditable: number
        }
        Insert: {
          id: string
          taskid: string
          message: string
          timestamp: string
          iseditable?: number
        }
        Update: {
          id?: string
          taskid?: string
          message?: string
          timestamp?: string
          iseditable?: number
        }
      }
    }
  }
}

export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type TaskLogRow = Database['public']['Tables']['task_logs']['Row']
export type TaskLogInsert = Database['public']['Tables']['task_logs']['Insert']
export type TaskLogUpdate = Database['public']['Tables']['task_logs']['Update']