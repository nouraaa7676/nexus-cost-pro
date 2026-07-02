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
      capex_requests: {
        Row: {
          business_justification: string | null
          business_unit: string
          created_at: string
          department_id: string | null
          estimated_budget: number
          expected_benefits: string | null
          expected_completion_date: string | null
          expected_start_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_code: string
          project_name: string
          request_date: string
          request_owner: string
          scope_of_work: string | null
          stage: Database["public"]["Enums"]["capex_stage"]
          submitted_by: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          business_justification?: string | null
          business_unit: string
          created_at?: string
          department_id?: string | null
          estimated_budget?: number
          expected_benefits?: string | null
          expected_completion_date?: string | null
          expected_start_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_code?: string
          project_name: string
          request_date?: string
          request_owner: string
          scope_of_work?: string | null
          stage?: Database["public"]["Enums"]["capex_stage"]
          submitted_by?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          business_justification?: string | null
          business_unit?: string
          created_at?: string
          department_id?: string | null
          estimated_budget?: number
          expected_benefits?: string | null
          expected_completion_date?: string | null
          expected_start_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_code?: string
          project_name?: string
          request_date?: string
          request_owner?: string
          scope_of_work?: string | null
          stage?: Database["public"]["Enums"]["capex_stage"]
          submitted_by?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capex_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      capex_reviews: {
        Row: {
          budget_available: boolean | null
          business_case_ok: boolean | null
          category_ok: boolean | null
          comments: string | null
          created_at: string
          financial_ok: boolean | null
          id: string
          request_id: string
          reviewer_id: string | null
          risk_ok: boolean | null
          roi_ok: boolean | null
          scope_ok: boolean | null
          updated_at: string
        }
        Insert: {
          budget_available?: boolean | null
          business_case_ok?: boolean | null
          category_ok?: boolean | null
          comments?: string | null
          created_at?: string
          financial_ok?: boolean | null
          id?: string
          request_id: string
          reviewer_id?: string | null
          risk_ok?: boolean | null
          roi_ok?: boolean | null
          scope_ok?: boolean | null
          updated_at?: string
        }
        Update: {
          budget_available?: boolean | null
          business_case_ok?: boolean | null
          category_ok?: boolean | null
          comments?: string | null
          created_at?: string
          financial_ok?: boolean | null
          id?: string
          request_id?: string
          reviewer_id?: string | null
          risk_ok?: boolean | null
          roi_ok?: boolean | null
          scope_ok?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capex_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecast: {
        Row: {
          actual_outflow: number
          created_at: string
          fiscal_year: number
          id: string
          period_month: number
          planned_outflow: number
          request_id: string | null
          updated_at: string
        }
        Insert: {
          actual_outflow?: number
          created_at?: string
          fiscal_year: number
          id?: string
          period_month: number
          planned_outflow?: number
          request_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_outflow?: number
          created_at?: string
          fiscal_year?: number
          id?: string
          period_month?: number
          planned_outflow?: number
          request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecast_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cesr_records: {
        Row: {
          budget_code: string | null
          budget_line: string | null
          capex_category: string | null
          cesr_number: string
          cost_center: string | null
          created_at: string
          department_id: string | null
          financial_details: string | null
          id: string
          procurement_approval: string | null
          project_owner: string | null
          proposal_attachment: string | null
          request_id: string | null
          scope_details: string | null
          task_name: string
          technical_details: string | null
          updated_at: string
        }
        Insert: {
          budget_code?: string | null
          budget_line?: string | null
          capex_category?: string | null
          cesr_number?: string
          cost_center?: string | null
          created_at?: string
          department_id?: string | null
          financial_details?: string | null
          id?: string
          procurement_approval?: string | null
          project_owner?: string | null
          proposal_attachment?: string | null
          request_id?: string | null
          scope_details?: string | null
          task_name: string
          technical_details?: string | null
          updated_at?: string
        }
        Update: {
          budget_code?: string | null
          budget_line?: string | null
          capex_category?: string | null
          cesr_number?: string
          cost_center?: string | null
          created_at?: string
          department_id?: string | null
          financial_details?: string | null
          id?: string
          procurement_approval?: string | null
          project_owner?: string | null
          proposal_attachment?: string | null
          request_id?: string | null
          scope_details?: string | null
          task_name?: string
          technical_details?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cesr_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cesr_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
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
      financial_processing: {
        Row: {
          available_budget_verified: boolean | null
          budget_line_validated: boolean | null
          budget_released: boolean | null
          created_at: string
          final_approved: boolean | null
          finance_user: string | null
          financial_reference: string | null
          id: string
          notes: string | null
          released_amount: number | null
          request_id: string
          updated_at: string
        }
        Insert: {
          available_budget_verified?: boolean | null
          budget_line_validated?: boolean | null
          budget_released?: boolean | null
          created_at?: string
          final_approved?: boolean | null
          finance_user?: string | null
          financial_reference?: string | null
          id?: string
          notes?: string | null
          released_amount?: number | null
          request_id: string
          updated_at?: string
        }
        Update: {
          available_budget_verified?: boolean | null
          budget_line_validated?: boolean | null
          budget_released?: boolean | null
          created_at?: string
          final_approved?: boolean | null
          finance_user?: string | null
          financial_reference?: string | null
          id?: string
          notes?: string | null
          released_amount?: number | null
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_processing_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
            referencedColumns: ["id"]
          },
        ]
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
      project_approvals: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"]
          actor_email: string | null
          actor_id: string | null
          comments: string | null
          created_at: string
          id: string
          request_id: string
          stage: Database["public"]["Enums"]["capex_stage"]
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_action"]
          actor_email?: string | null
          actor_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          request_id: string
          stage: Database["public"]["Enums"]["capex_stage"]
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_action"]
          actor_email?: string | null
          actor_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string
          stage?: Database["public"]["Enums"]["capex_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "project_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          file_kind: string | null
          file_name: string
          file_path: string | null
          id: string
          request_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_kind?: string | null
          file_name: string
          file_path?: string | null
          id?: string
          request_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_kind?: string | null
          file_name?: string
          file_path?: string | null
          id?: string
          request_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "capex_requests"
            referencedColumns: ["id"]
          },
        ]
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
      approval_action: "approve" | "reject" | "return"
      budget_type: "CAPEX" | "OPEX"
      capex_stage:
        | "draft"
        | "commercial"
        | "budget_review"
        | "department_manager"
        | "senior_manager"
        | "svp"
        | "finance"
        | "completed"
        | "rejected"
      invoice_status: "pending" | "approved" | "rejected" | "paid" | "flagged"
      priority_level: "low" | "medium" | "high" | "critical"
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
      approval_action: ["approve", "reject", "return"],
      budget_type: ["CAPEX", "OPEX"],
      capex_stage: [
        "draft",
        "commercial",
        "budget_review",
        "department_manager",
        "senior_manager",
        "svp",
        "finance",
        "completed",
        "rejected",
      ],
      invoice_status: ["pending", "approved", "rejected", "paid", "flagged"],
      priority_level: ["low", "medium", "high", "critical"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
