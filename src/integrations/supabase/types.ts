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
      alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          impact_amount: number | null
          related_id: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string | null
          status: Database["public"]["Enums"]["alert_status"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          impact_amount?: number | null
          related_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          impact_amount?: number | null
          related_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          actual_amount: number
          budget_type: Database["public"]["Enums"]["budget_type"]
          category: string | null
          created_at: string
          department_id: string | null
          fiscal_year: number
          id: string
          period_month: number | null
          planned_amount: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          budget_type: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          created_at?: string
          department_id?: string | null
          fiscal_year: number
          id?: string
          period_month?: number | null
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          created_at?: string
          department_id?: string | null
          fiscal_year?: number
          id?: string
          period_month?: number | null
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          department_id: string | null
          end_date: string | null
          id: string
          renewal_date: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          value: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          value?: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          value?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          annual_budget: number
          code: string
          created_at: string
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          annual_budget?: number
          code: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          annual_budget?: number
          code?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          budget_type: Database["public"]["Enums"]["budget_type"] | null
          confidence: number | null
          fiscal_year: number
          forecast_amount: number
          generated_at: string
          id: string
          notes: string | null
          period_month: number | null
          risk: Database["public"]["Enums"]["risk_level"] | null
          scope: string
          scope_ref: string | null
        }
        Insert: {
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          confidence?: number | null
          fiscal_year: number
          forecast_amount: number
          generated_at?: string
          id?: string
          notes?: string | null
          period_month?: number | null
          risk?: Database["public"]["Enums"]["risk_level"] | null
          scope: string
          scope_ref?: string | null
        }
        Update: {
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          confidence?: number | null
          fiscal_year?: number
          forecast_amount?: number
          generated_at?: string
          id?: string
          notes?: string | null
          period_month?: number | null
          risk?: Database["public"]["Enums"]["risk_level"] | null
          scope?: string
          scope_ref?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          ai_flags: Json | null
          amount: number
          budget_type: Database["public"]["Enums"]["budget_type"] | null
          category: string | null
          created_at: string
          department_id: string | null
          file_url: string | null
          id: string
          invoice_date: string
          invoice_number: string
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          submitted_by: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          ai_flags?: Json | null
          amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          category?: string | null
          created_at?: string
          department_id?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_by?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          ai_flags?: Json | null
          amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          category?: string | null
          created_at?: string
          department_id?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_by?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_amount: number
          budget_type: Database["public"]["Enums"]["budget_type"]
          code: string | null
          created_at: string
          department_id: string | null
          end_date: string | null
          id: string
          name: string
          planned_amount: number
          risk: Database["public"]["Enums"]["risk_level"] | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          code?: string | null
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          name: string
          planned_amount?: number
          risk?: Database["public"]["Enums"]["risk_level"] | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          code?: string | null
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          name?: string
          planned_amount?: number
          risk?: Database["public"]["Enums"]["risk_level"] | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string | null
          created_at: string
          generated_by: string | null
          id: string
          report_type: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          report_type: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          report_type?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          active: boolean
          category: string | null
          contact_email: string | null
          created_at: string
          id: string
          name: string
          performance_rating: number | null
          risk_rating: Database["public"]["Enums"]["risk_level"] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          name: string
          performance_rating?: number | null
          risk_rating?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          name?: string
          performance_rating?: number | null
          risk_rating?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "open" | "acknowledged" | "resolved"
      app_role:
        | "executive"
        | "finance_director"
        | "budget_team"
        | "department_manager"
        | "business_user"
        | "admin"
      budget_type: "CAPEX" | "OPEX"
      invoice_status: "pending" | "approved" | "rejected" | "paid" | "flagged"
      risk_level: "low" | "medium" | "high"
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
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["open", "acknowledged", "resolved"],
      app_role: [
        "executive",
        "finance_director",
        "budget_team",
        "department_manager",
        "business_user",
        "admin",
      ],
      budget_type: ["CAPEX", "OPEX"],
      invoice_status: ["pending", "approved", "rejected", "paid", "flagged"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
