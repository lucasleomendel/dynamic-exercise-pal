export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_compositions: {
        Row: {
          body_fat: number | null
          classification: string | null
          created_at: string
          fat_mass: number | null
          id: string
          lean_mass: number | null
          measured_at: string
          measurements: Json | null
          method: string | null
          skinfolds: Json | null
          user_id: string
        }
        Insert: {
          body_fat?: number | null
          classification?: string | null
          created_at?: string
          fat_mass?: number | null
          id?: string
          lean_mass?: number | null
          measured_at?: string
          measurements?: Json | null
          method?: string | null
          skinfolds?: Json | null
          user_id: string
        }
        Update: {
          body_fat?: number | null
          classification?: string | null
          created_at?: string
          fat_mass?: number | null
          id?: string
          lean_mass?: number | null
          measured_at?: string
          measurements?: Json | null
          method?: string | null
          skinfolds?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          created_at: string
          diet_data: Json
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diet_data: Json
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diet_data?: Json
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_checks: {
        Row: {
          checks_data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checks_data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checks_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_student_links: {
        Row: {
          created_at: string | null
          id: string
          personal_id: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          personal_id: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          personal_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          days_per_week: number | null
          email: string | null
          goal: string | null
          height: number | null
          hours_per_session: number | null
          id: string
          last_synced_at: string | null
          level: string | null
          name: string | null
          phone: string | null
          selected_muscles: string[] | null
          sex: string | null
          split_legs: boolean | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          days_per_week?: number | null
          email?: string | null
          goal?: string | null
          height?: number | null
          hours_per_session?: number | null
          id?: string
          last_synced_at?: string | null
          level?: string | null
          name?: string | null
          phone?: string | null
          selected_muscles?: string[] | null
          sex?: string | null
          split_legs?: boolean | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          days_per_week?: number | null
          email?: string | null
          goal?: string | null
          height?: number | null
          hours_per_session?: number | null
          id?: string
          last_synced_at?: string | null
          level?: string | null
          name?: string | null
          phone?: string | null
          selected_muscles?: string[] | null
          sex?: string | null
          split_legs?: boolean | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      students: {
        Row: {
          birth_date: string | null
          cpf: string
          created_at: string | null
          email: string | null
          full_name: string
          goal: string | null
          height: number | null
          id: string
          level: string | null
          notes: string | null
          phone: string | null
          sex: string | null
          updated_at: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          cpf: string
          created_at?: string | null
          email?: string | null
          full_name: string
          goal?: string | null
          height?: number | null
          id?: string
          level?: string | null
          notes?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          goal?: string | null
          height?: number | null
          id?: string
          level?: string | null
          notes?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          goal_ml: number | null
          id: string
          log_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          goal_ml?: number | null
          id?: string
          log_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          goal_ml?: number | null
          id?: string
          log_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          exercise_key: string
          exercise_name: string
          id: string
          logged_at: string
          muscle: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          exercise_key: string
          exercise_name: string
          id?: string
          logged_at?: string
          muscle?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          exercise_key?: string
          exercise_name?: string
          id?: string
          logged_at?: string
          muscle?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_history: {
        Row: {
          completed_exercises: number
          created_at: string
          day_focus: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          total_exercises: number
          user_id: string
          workout_date: string
        }
        Insert: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id: string
          workout_date?: string
        }
        Update: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      workout_history_2026: {
        Row: {
          completed_exercises: number
          created_at: string
          day_focus: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          total_exercises: number
          user_id: string
          workout_date: string
        }
        Insert: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id: string
          workout_date?: string
        }
        Update: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      workout_history_2027: {
        Row: {
          completed_exercises: number
          created_at: string
          day_focus: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          total_exercises: number
          user_id: string
          workout_date: string
        }
        Insert: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id: string
          workout_date?: string
        }
        Update: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      workout_history_default: {
        Row: {
          completed_exercises: number
          created_at: string
          day_focus: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          total_exercises: number
          user_id: string
          workout_date: string
        }
        Insert: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id: string
          workout_date?: string
        }
        Update: {
          completed_exercises?: number
          created_at?: string
          day_focus?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          days_per_week: number | null
          description: string | null
          id: string
          is_active: boolean | null
          plan_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          plan_data: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          plan_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      daily_health_check: { Args: never; Returns: Json }
      ensure_workout_history_partition: {
        Args: { p_year: number }
        Returns: undefined
      }
      is_personal_trainer: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
