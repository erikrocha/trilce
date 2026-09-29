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
      academic_years: {
        Row: {
          classroom: string | null
          created_at: string
          final_status: string | null
          grade: string | null
          id: string
          level: Database["public"]["Enums"]["enrollment_level"] | null
          school_name: string | null
          section: string | null
          student_id: string
          year: number
        }
        Insert: {
          classroom?: string | null
          created_at?: string
          final_status?: string | null
          grade?: string | null
          id?: string
          level?: Database["public"]["Enums"]["enrollment_level"] | null
          school_name?: string | null
          section?: string | null
          student_id: string
          year: number
        }
        Update: {
          classroom?: string | null
          created_at?: string
          final_status?: string | null
          grade?: string | null
          id?: string
          level?: Database["public"]["Enums"]["enrollment_level"] | null
          school_name?: string | null
          section?: string | null
          student_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      auth_challenges: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          max_attempts: number
          purpose: Database["public"]["Enums"]["challenge_purpose"]
          requested_ip: string | null
          status: Database["public"]["Enums"]["challenge_status"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          max_attempts?: number
          purpose: Database["public"]["Enums"]["challenge_purpose"]
          requested_ip?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: Database["public"]["Enums"]["challenge_purpose"]
          requested_ip?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          due_date: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          provider: Database["public"]["Enums"]["gateway_provider"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["billing_invoice_status"]
          student_count_snapshot: number | null
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          due_date?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          provider?: Database["public"]["Enums"]["gateway_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["billing_invoice_status"]
          student_count_snapshot?: number | null
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          due_date?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          provider?: Database["public"]["Enums"]["gateway_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["billing_invoice_status"]
          student_count_snapshot?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_groups: {
        Row: {
          academic_year: number
          created_at: string
          grade: string
          id: string
          level: Database["public"]["Enums"]["enrollment_level"]
          school_id: string
          section: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          created_at?: string
          grade: string
          id?: string
          level: Database["public"]["Enums"]["enrollment_level"]
          school_id: string
          section: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          created_at?: string
          grade?: string
          id?: string
          level?: Database["public"]["Enums"]["enrollment_level"]
          school_id?: string
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      course_offerings: {
        Row: {
          class_group_id: string
          course_id: string
          created_at: string
          id: string
          school_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_group_id: string
          course_id: string
          created_at?: string
          id?: string
          school_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_group_id?: string
          course_id?: string
          created_at?: string
          id?: string
          school_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_offerings_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          school_id: string
          short_code: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          school_id: string
          short_code?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          short_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      document_series: {
        Row: {
          active: boolean
          created_at: string
          document_type_id: string
          id: string
          next_correlative: number
          series_code: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          document_type_id: string
          id?: string
          next_correlative?: number
          series_code: string
        }
        Update: {
          active?: boolean
          created_at?: string
          document_type_id?: string
          id?: string
          next_correlative?: number
          series_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_series_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_electronic: boolean
          name: string
          requires_igv: boolean
          school_id: string
          short_code: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_electronic?: boolean
          name: string
          requires_igv?: boolean
          school_id: string
          short_code?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_electronic?: boolean
          name?: string
          requires_igv?: boolean
          school_id?: string
          short_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      game_attempts: {
        Row: {
          answered_at: string
          correct_answer: string
          given_answer: string
          id: string
          is_correct: boolean
          question: Json
          recorded_by: string | null
          school_id: string
          seed: number
          session_id: string
          skill_id: string
          student_id: string
          tag: string | null
        }
        Insert: {
          answered_at?: string
          correct_answer: string
          given_answer: string
          id?: string
          is_correct: boolean
          question: Json
          recorded_by?: string | null
          school_id: string
          seed: number
          session_id: string
          skill_id: string
          student_id: string
          tag?: string | null
        }
        Update: {
          answered_at?: string
          correct_answer?: string
          given_answer?: string
          id?: string
          is_correct?: boolean
          question?: Json
          recorded_by?: string | null
          school_id?: string
          seed?: number
          session_id?: string
          skill_id?: string
          student_id?: string
          tag?: string | null
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          answered: number
          correct_count: number
          id: string
          mastered_at: string | null
          recorded_by: string | null
          school_id: string
          score: number
          skill_id: string
          started_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          answered?: number
          correct_count?: number
          id?: string
          mastered_at?: string | null
          recorded_by?: string | null
          school_id: string
          score?: number
          skill_id: string
          started_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          answered?: number
          correct_count?: number
          id?: string
          mastered_at?: string | null
          recorded_by?: string | null
          school_id?: string
          score?: number
          skill_id?: string
          started_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      guardians: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_id_type"] | null
          education_level: string | null
          email: string | null
          first_names: string
          id: string
          job_title: string | null
          maternal_surname: string | null
          mobile: string | null
          paternal_surname: string | null
          phone: string | null
          profession: string | null
          school_id: string
          sex: Database["public"]["Enums"]["sex_type"] | null
          updated_at: string
          work_address: string | null
          work_phone: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          education_level?: string | null
          email?: string | null
          first_names: string
          id?: string
          job_title?: string | null
          maternal_surname?: string | null
          mobile?: string | null
          paternal_surname?: string | null
          phone?: string | null
          profession?: string | null
          school_id: string
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          work_address?: string | null
          work_phone?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          education_level?: string | null
          email?: string | null
          first_names?: string
          id?: string
          job_title?: string | null
          maternal_surname?: string | null
          mobile?: string | null
          paternal_surname?: string | null
          phone?: string | null
          profession?: string | null
          school_id?: string
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          work_address?: string | null
          work_phone?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year: number
          amount: number
          balance: number | null
          concept_type: Database["public"]["Enums"]["concept_type"]
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          description: string
          discount_amount: number
          discount_reason: Database["public"]["Enums"]["discount_reason"] | null
          due_date: string
          id: string
          month: number | null
          mora_amount: number
          paid_amount: number
          prorroga_date: string | null
          schedule_id: string | null
          school_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          amount: number
          balance?: number | null
          concept_type: Database["public"]["Enums"]["concept_type"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description: string
          discount_amount?: number
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          due_date: string
          id?: string
          month?: number | null
          mora_amount?: number
          paid_amount?: number
          prorroga_date?: string | null
          schedule_id?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          amount?: number
          balance?: number | null
          concept_type?: Database["public"]["Enums"]["concept_type"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string
          discount_amount?: number
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          due_date?: string
          id?: string
          month?: number | null
          mora_amount?: number
          paid_amount?: number
          prorroga_date?: string | null
          schedule_id?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tuition_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          guardian_id: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["membership_role"]
          school_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          student_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          guardian_id?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["membership_role"]
          school_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          student_id?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          guardian_id?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          school_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          student_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_invites_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_invites_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_invites_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          active: boolean
          created_at: string
          guardian_id: string | null
          id: string
          is_owner: boolean
          role: Database["public"]["Enums"]["membership_role"]
          school_id: string
          staff_id: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          guardian_id?: string | null
          id?: string
          is_owner?: boolean
          role: Database["public"]["Enums"]["membership_role"]
          school_id: string
          staff_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          guardian_id?: string | null
          id?: string
          is_owner?: boolean
          role?: Database["public"]["Enums"]["membership_role"]
          school_id?: string
          staff_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          enabled: boolean
          factor_type: Database["public"]["Enums"]["mfa_factor_type"]
          id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          factor_type: Database["public"]["Enums"]["mfa_factor_type"]
          id?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          factor_type?: Database["public"]["Enums"]["mfa_factor_type"]
          id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      payment_document_items: {
        Row: {
          academic_year: number | null
          amount: number | null
          concept_type: Database["public"]["Enums"]["concept_type"] | null
          created_at: string
          discount_amount: number
          document_id: string
          id: string
          igv_amount: number
          invoice_id: string
          item_order: number
          month: number | null
          mora_amount: number
          quantity: number
          total_pago: number
          unit_amount: number
        }
        Insert: {
          academic_year?: number | null
          amount?: number | null
          concept_type?: Database["public"]["Enums"]["concept_type"] | null
          created_at?: string
          discount_amount?: number
          document_id: string
          id?: string
          igv_amount?: number
          invoice_id: string
          item_order?: number
          month?: number | null
          mora_amount?: number
          quantity?: number
          total_pago: number
          unit_amount: number
        }
        Update: {
          academic_year?: number | null
          amount?: number | null
          concept_type?: Database["public"]["Enums"]["concept_type"] | null
          created_at?: string
          discount_amount?: number
          document_id?: string
          id?: string
          igv_amount?: number
          invoice_id?: string
          item_order?: number
          month?: number | null
          mora_amount?: number
          quantity?: number
          total_pago?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "payment_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_document_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_document_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices_display"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_documents: {
        Row: {
          correlative: number
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          discount_total: number
          guardian_id: string | null
          id: string
          igv_total: number
          issue_date: string
          mora_total: number
          origin_id: string
          payment_date: string
          reference: string | null
          school_id: string
          series_id: string
          status: Database["public"]["Enums"]["document_status"]
          student_id: string
          subtotal: number
          total_amount: number
        }
        Insert: {
          correlative: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          discount_total?: number
          guardian_id?: string | null
          id?: string
          igv_total?: number
          issue_date?: string
          mora_total?: number
          origin_id: string
          payment_date?: string
          reference?: string | null
          school_id: string
          series_id: string
          status?: Database["public"]["Enums"]["document_status"]
          student_id: string
          subtotal?: number
          total_amount?: number
        }
        Update: {
          correlative?: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          discount_total?: number
          guardian_id?: string | null
          id?: string
          igv_total?: number
          issue_date?: string
          mora_total?: number
          origin_id?: string
          payment_date?: string
          reference?: string | null
          school_id?: string
          series_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          student_id?: string
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_documents_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_documents_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "payment_origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_documents_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "document_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_accounts: {
        Row: {
          created_at: string
          external_customer_id: string | null
          id: string
          metadata: Json
          provider: Database["public"]["Enums"]["gateway_provider"]
          school_id: string
        }
        Insert: {
          created_at?: string
          external_customer_id?: string | null
          id?: string
          metadata?: Json
          provider: Database["public"]["Enums"]["gateway_provider"]
          school_id: string
        }
        Update: {
          created_at?: string
          external_customer_id?: string | null
          id?: string
          metadata?: Json
          provider?: Database["public"]["Enums"]["gateway_provider"]
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_origins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          requires_reference: boolean
          school_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          requires_reference?: boolean
          school_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          requires_reference?: boolean
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_origins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          fixed_price: number | null
          id: string
          max_guardians: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          price_per_student: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          requires_manual_approval: boolean
          trial_days: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          fixed_price?: number | null
          id?: string
          max_guardians?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          price_per_student?: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          requires_manual_approval?: boolean
          trial_days?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          fixed_price?: number | null
          id?: string
          max_guardians?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          price_per_student?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          requires_manual_approval?: boolean
          trial_days?: number | null
        }
        Relationships: []
      }
      platform_staff: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_staff_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_staff_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      previous_schools: {
        Row: {
          created_at: string
          district: string | null
          id: string
          institution: string | null
          student_id: string
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          institution?: string | null
          student_id: string
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          institution?: string | null
          student_id?: string
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "previous_schools_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          label: string
          order_index: number
          question_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          label: string
          order_index?: number
          question_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string
          order_index?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          quiz_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          quiz_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          quiz_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answered_at: string
          id: string
          option_id: string
          question_id: string
          recorded_by: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          option_id: string
          question_id: string
          recorded_by?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          option_id?: string
          question_id?: string
          recorded_by?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "quiz_question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          closed_at: string | null
          course_offering_id: string
          created_at: string
          current_question_id: string | null
          id: string
          opened_at: string | null
          quiz_id: string
          status: Database["public"]["Enums"]["quiz_session_status"]
        }
        Insert: {
          closed_at?: string | null
          course_offering_id: string
          created_at?: string
          current_question_id?: string | null
          id?: string
          opened_at?: string | null
          quiz_id: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
        }
        Update: {
          closed_at?: string | null
          course_offering_id?: string
          created_at?: string
          current_question_id?: string | null
          id?: string
          opened_at?: string | null
          quiz_id?: string
          status?: Database["public"]["Enums"]["quiz_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_activities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_periods: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_break: boolean
          label: string | null
          school_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_break?: boolean
          label?: string | null
          school_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_break?: boolean
          label?: string | null
          school_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_periods_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slots: {
        Row: {
          activity_id: string | null
          classroom: string | null
          course_offering_id: string | null
          created_at: string
          day_of_week: number
          id: string
          period_id: string
          school_id: string
        }
        Insert: {
          activity_id?: string | null
          classroom?: string | null
          course_offering_id?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          period_id: string
          school_id: string
        }
        Update: {
          activity_id?: string | null
          classroom?: string | null
          course_offering_id?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          period_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "schedule_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          school_type: Database["public"]["Enums"]["school_type"]
          slug: string | null
          status: Database["public"]["Enums"]["school_status"]
          subdomain: string | null
          suspended_at: string | null
          suspended_reason: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          school_type?: Database["public"]["Enums"]["school_type"]
          slug?: string | null
          status?: Database["public"]["Enums"]["school_status"]
          subdomain?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          slug?: string | null
          status?: Database["public"]["Enums"]["school_status"]
          subdomain?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_assigned_sections: {
        Row: {
          created_at: string
          grade: string
          id: string
          level: Database["public"]["Enums"]["enrollment_level"]
          school_id: string
          section: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          level: Database["public"]["Enums"]["enrollment_level"]
          school_id: string
          section?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          level?: Database["public"]["Enums"]["enrollment_level"]
          school_id?: string
          section?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assigned_sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assigned_sections_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_id_type"] | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          school_id: string
          staff_type: Database["public"]["Enums"]["staff_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          school_id: string
          staff_type: Database["public"]["Enums"]["staff_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          school_id?: string
          staff_type?: Database["public"]["Enums"]["staff_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          is_billing_responsible: boolean
          is_emergency_contact: boolean
          lives_with: boolean
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          is_billing_responsible?: boolean
          is_emergency_contact?: boolean
          lives_with?: boolean
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          is_billing_responsible?: boolean
          is_emergency_contact?: boolean
          lives_with?: boolean
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          class_group_id: string | null
          code: string
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_id_type"] | null
          enrolled: boolean
          entry_date: string | null
          entry_year: number | null
          exit_date: string | null
          exit_reason: string | null
          first_names: string
          grade: string | null
          id: string
          institutional_email: string | null
          level: Database["public"]["Enums"]["enrollment_level"] | null
          maternal_surname: string | null
          paternal_surname: string
          photo_url: string | null
          school_id: string
          section: string | null
          sex: Database["public"]["Enums"]["sex_type"] | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          class_group_id?: string | null
          code: string
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          enrolled?: boolean
          entry_date?: string | null
          entry_year?: number | null
          exit_date?: string | null
          exit_reason?: string | null
          first_names: string
          grade?: string | null
          id?: string
          institutional_email?: string | null
          level?: Database["public"]["Enums"]["enrollment_level"] | null
          maternal_surname?: string | null
          paternal_surname: string
          photo_url?: string | null
          school_id: string
          section?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          class_group_id?: string | null
          code?: string
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_id_type"] | null
          enrolled?: boolean
          entry_date?: string | null
          entry_year?: number | null
          exit_date?: string | null
          exit_reason?: string | null
          first_names?: string
          grade?: string | null
          id?: string
          institutional_email?: string | null
          level?: Database["public"]["Enums"]["enrollment_level"] | null
          maternal_surname?: string | null
          paternal_surname?: string
          photo_url?: string | null
          school_id?: string
          section?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          activated_by: string | null
          activation_type: Database["public"]["Enums"]["activation_type"]
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan_id: string
          school_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          activated_by?: string | null
          activation_type?: Database["public"]["Enums"]["activation_type"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id: string
          school_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_by?: string | null
          activation_type?: Database["public"]["Enums"]["activation_type"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_label: string | null
          id: string
          ip_address: string | null
          last_seen_at: string
          revoked_at: string | null
          trusted_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_label?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          trusted_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_label?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          trusted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tuition_schedule: {
        Row: {
          academic_year: number
          amount: number
          concept_type: Database["public"]["Enums"]["concept_type"]
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          month: number | null
          school_id: string
        }
        Insert: {
          academic_year: number
          amount: number
          concept_type: Database["public"]["Enums"]["concept_type"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          month?: number | null
          school_id: string
        }
        Update: {
          academic_year?: number
          amount?: number
          concept_type?: Database["public"]["Enums"]["concept_type"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          month?: number | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_schedule_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          contact_email: string | null
          contact_email_verified: boolean
          created_at: string
          full_name: string | null
          id: string
          last_active_school_id: string | null
          locale: string | null
          mfa_required: boolean
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_email_verified?: boolean
          created_at?: string
          full_name?: string | null
          id: string
          last_active_school_id?: string | null
          locale?: string | null
          mfa_required?: boolean
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_email_verified?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          last_active_school_id?: string | null
          locale?: string | null
          mfa_required?: boolean
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_last_active_school_id_fkey"
            columns: ["last_active_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      student_invoices_display: {
        Row: {
          academic_year: number | null
          amount: number | null
          balance: number | null
          concept_type: Database["public"]["Enums"]["concept_type"] | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          discount_amount: number | null
          discount_reason: Database["public"]["Enums"]["discount_reason"] | null
          display_status: string | null
          due_date: string | null
          id: string | null
          month: number | null
          mora_amount: number | null
          paid_amount: number | null
          prorroga_date: string | null
          schedule_id: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: number | null
          amount?: number | null
          balance?: number | null
          concept_type?: Database["public"]["Enums"]["concept_type"] | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          discount_amount?: number | null
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          display_status?: never
          due_date?: string | null
          id?: string | null
          month?: number | null
          mora_amount?: number | null
          paid_amount?: number | null
          prorroga_date?: string | null
          schedule_id?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: number | null
          amount?: number | null
          balance?: number | null
          concept_type?: Database["public"]["Enums"]["concept_type"] | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          discount_amount?: number | null
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          display_status?: never
          due_date?: string | null
          id?: string | null
          month?: number | null
          mora_amount?: number | null
          paid_amount?: number | null
          prorroga_date?: string | null
          schedule_id?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tuition_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_membership_login: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_role: Database["public"]["Enums"]["membership_role"]
          p_school_id: string
          p_target_id: string
          p_username: string
        }
        Returns: string
      }
      create_platform_staff_login: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_role: Database["public"]["Enums"]["platform_staff_role"]
          p_username: string
        }
        Returns: string
      }
      current_staff_id: { Args: { target_school_id: string }; Returns: string }
      has_class_group_access: {
        Args: { target_class_group_id: string }
        Returns: boolean
      }
      has_school_access: {
        Args: { target_school_id: string }
        Returns: boolean
      }
      has_school_role: {
        Args: { roles: string[]; target_school_id: string }
        Returns: boolean
      }
      is_assigned_to_student: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      is_guardian_of_student: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      is_own_student: { Args: { target_student_id: string }; Returns: boolean }
      is_platform_staff: { Args: never; Returns: boolean }
      next_document_correlative: {
        Args: { p_series_id: string }
        Returns: number
      }
      resolve_login_email: { Args: { p_username: string }; Returns: string }
      seed_default_school_catalog: {
        Args: { p_school_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activation_type: "manual" | "gateway"
      billing_invoice_status: "pendiente" | "pagado" | "vencido" | "anulado"
      challenge_purpose: "device_verification" | "login_otp" | "password_reset"
      challenge_status: "pending" | "verified" | "expired" | "failed"
      concept_type: "matricula" | "pension"
      currency_type: "PEN" | "USD"
      discount_reason: "beca" | "exoneracion" | "descuento_comercial" | "otro"
      document_id_type: "DNI" | "CE" | "Pasaporte" | "Otro"
      document_status: "emitido" | "anulado"
      enrollment_level: "inicial" | "primaria" | "secundaria"
      gateway_provider: "manual" | "pagoefectivo" | "stripe" | "culqi"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      invoice_status: "pendiente" | "parcial" | "pagado" | "vencido" | "anulado"
      membership_role:
        | "admin"
        | "administrativo"
        | "docente"
        | "padre"
        | "alumno"
      mfa_factor_type: "device_trust" | "email_otp" | "totp" | "sms"
      platform_staff_role: "superadmin" | "support"
      pricing_model: "free" | "per_student" | "fixed"
      quiz_session_status: "borrador" | "activo" | "cerrado"
      relationship_type:
        | "papa"
        | "mama"
        | "apoderado"
        | "abuelo"
        | "abuela"
        | "tio"
        | "tia"
        | "hermano"
        | "otro"
      school_status: "trial" | "active" | "past_due" | "suspended"
      school_type: "publico" | "privado"
      sex_type: "M" | "F"
      staff_type: "docente" | "administrativo"
      student_status: "activo" | "retirado" | "egresado"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "suspended"
        | "canceled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activation_type: ["manual", "gateway"],
      billing_invoice_status: ["pendiente", "pagado", "vencido", "anulado"],
      challenge_purpose: ["device_verification", "login_otp", "password_reset"],
      challenge_status: ["pending", "verified", "expired", "failed"],
      concept_type: ["matricula", "pension"],
      currency_type: ["PEN", "USD"],
      discount_reason: ["beca", "exoneracion", "descuento_comercial", "otro"],
      document_id_type: ["DNI", "CE", "Pasaporte", "Otro"],
      document_status: ["emitido", "anulado"],
      enrollment_level: ["inicial", "primaria", "secundaria"],
      gateway_provider: ["manual", "pagoefectivo", "stripe", "culqi"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      invoice_status: ["pendiente", "parcial", "pagado", "vencido", "anulado"],
      membership_role: [
        "admin",
        "administrativo",
        "docente",
        "padre",
        "alumno",
      ],
      mfa_factor_type: ["device_trust", "email_otp", "totp", "sms"],
      platform_staff_role: ["superadmin", "support"],
      pricing_model: ["free", "per_student", "fixed"],
      quiz_session_status: ["borrador", "activo", "cerrado"],
      relationship_type: [
        "papa",
        "mama",
        "apoderado",
        "abuelo",
        "abuela",
        "tio",
        "tia",
        "hermano",
        "otro",
      ],
      school_status: ["trial", "active", "past_due", "suspended"],
      school_type: ["publico", "privado"],
      sex_type: ["M", "F"],
      staff_type: ["docente", "administrativo"],
      student_status: ["activo", "retirado", "egresado"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "suspended",
        "canceled",
      ],
    },
  },
} as const
