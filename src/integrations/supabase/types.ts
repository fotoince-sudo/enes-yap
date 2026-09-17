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
      activity_log: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_status: string | null
          note: string | null
          old_status: string | null
        }
        Insert: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
        }
        Relationships: []
      }
      before_after: {
        Row: {
          after_url: string | null
          before_url: string | null
          created_at: string
          description: string | null
          happened_on: string | null
          id: string
          is_published: boolean
          progress_urls: Json
          project_id: string | null
          sort_order: number
          title: string | null
          updated_at: string
          work_type: string | null
        }
        Insert: {
          after_url?: string | null
          before_url?: string | null
          created_at?: string
          description?: string | null
          happened_on?: string | null
          id?: string
          is_published?: boolean
          progress_urls?: Json
          project_id?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          work_type?: string | null
        }
        Update: {
          after_url?: string | null
          before_url?: string | null
          created_at?: string
          description?: string | null
          happened_on?: string | null
          id?: string
          is_published?: boolean
          progress_urls?: Json
          project_id?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "before_after_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          id: string
          last_contact_at: string | null
          neighborhood: string | null
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_contact_at?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_contact_at?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      emir_chat_sessions: {
        Row: {
          collected: Json
          created_at: string
          flags: Json
          id: string
          last_flag_at: string | null
          logged_message_count: number
          message_count: number
          messages: Json
          quote_id: string | null
          request_id: string | null
          status: string
          stop_reason: string | null
          summary: string | null
          survey_id: string | null
          updated_at: string
          wants_survey: boolean
        }
        Insert: {
          collected?: Json
          created_at?: string
          flags?: Json
          id?: string
          last_flag_at?: string | null
          logged_message_count?: number
          message_count?: number
          messages?: Json
          quote_id?: string | null
          request_id?: string | null
          status?: string
          stop_reason?: string | null
          summary?: string | null
          survey_id?: string | null
          updated_at?: string
          wants_survey?: boolean
        }
        Update: {
          collected?: Json
          created_at?: string
          flags?: Json
          id?: string
          last_flag_at?: string | null
          logged_message_count?: number
          message_count?: number
          messages?: Json
          quote_id?: string | null
          request_id?: string | null
          status?: string
          stop_reason?: string | null
          summary?: string | null
          survey_id?: string | null
          updated_at?: string
          wants_survey?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "emir_chat_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emir_chat_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emir_chat_sessions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_runs: {
        Row: {
          allowed: number
          blocked: number
          checked: number
          collected: number
          created_at: string
          details: Json
          engine_key: string
          id: string
          message: string | null
          new_prospects: number
          status: string
          trigger: string
          unreachable: number
        }
        Insert: {
          allowed?: number
          blocked?: number
          checked?: number
          collected?: number
          created_at?: string
          details?: Json
          engine_key: string
          id?: string
          message?: string | null
          new_prospects?: number
          status: string
          trigger?: string
          unreachable?: number
        }
        Update: {
          allowed?: number
          blocked?: number
          checked?: number
          collected?: number
          created_at?: string
          details?: Json
          engine_key?: string
          id?: string
          message?: string | null
          new_prospects?: number
          status?: string
          trigger?: string
          unreachable?: number
        }
        Relationships: []
      }
      engine_state: {
        Row: {
          key: string
          label: string
          last_result: Json | null
          last_run_at: string | null
          lease_until: string | null
          paused_reason: string | null
          run_count: number
          status: string
          updated_at: string
        }
        Insert: {
          key: string
          label: string
          last_result?: Json | null
          last_run_at?: string | null
          lease_until?: string | null
          paused_reason?: string | null
          run_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          key?: string
          label?: string
          last_result?: Json | null
          last_run_at?: string | null
          lease_until?: string | null
          paused_reason?: string | null
          run_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_prospects: {
        Row: {
          assigned_to: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_source_note: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          district: string | null
          estimated_value: number | null
          estimated_work_type: string | null
          first_contact_at: string | null
          id: string
          last_contact_at: string | null
          listing_date: string | null
          listing_url: string | null
          matched_request_id: string | null
          need_type: string | null
          neighborhood: string | null
          normalized_url: string | null
          notes: string | null
          opportunity_id: string | null
          pipeline_error: string | null
          pipeline_stage: string | null
          property_id: string | null
          score: number | null
          score_reason: string | null
          scored_at: string | null
          source: string
          source_permission: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_source_note?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          district?: string | null
          estimated_value?: number | null
          estimated_work_type?: string | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          listing_date?: string | null
          listing_url?: string | null
          matched_request_id?: string | null
          need_type?: string | null
          neighborhood?: string | null
          normalized_url?: string | null
          notes?: string | null
          opportunity_id?: string | null
          pipeline_error?: string | null
          pipeline_stage?: string | null
          property_id?: string | null
          score?: number | null
          score_reason?: string | null
          scored_at?: string | null
          source?: string
          source_permission?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_source_note?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          district?: string | null
          estimated_value?: number | null
          estimated_work_type?: string | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          listing_date?: string | null
          listing_url?: string | null
          matched_request_id?: string | null
          need_type?: string | null
          neighborhood?: string | null
          normalized_url?: string | null
          notes?: string | null
          opportunity_id?: string | null
          pipeline_error?: string | null
          pipeline_stage?: string | null
          property_id?: string | null
          score?: number | null
          score_reason?: string | null
          scored_at?: string | null
          source?: string
          source_permission?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_prospects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_prospects_matched_request_id_fkey"
            columns: ["matched_request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_prospects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_prospects_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          name: string
          notes: string | null
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          name: string
          notes?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          name?: string
          notes?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          kind: string
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          city: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          district: string | null
          estimated_value: number | null
          first_contact_at: string | null
          id: string
          last_contact_at: string | null
          listing_date: string | null
          listing_title: string | null
          listing_url: string | null
          neighborhood: string | null
          notes: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          phone: string | null
          property_id: string | null
          property_type: string | null
          renovation_likelihood: string | null
          request_id: string | null
          sale_rent_status: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          district?: string | null
          estimated_value?: number | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          listing_date?: string | null
          listing_title?: string | null
          listing_url?: string | null
          neighborhood?: string | null
          notes?: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          phone?: string | null
          property_id?: string | null
          property_type?: string | null
          renovation_likelihood?: string | null
          request_id?: string | null
          sale_rent_status?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          district?: string | null
          estimated_value?: number | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          listing_date?: string | null
          listing_title?: string | null
          listing_url?: string | null
          neighborhood?: string | null
          notes?: string | null
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          phone?: string | null
          property_id?: string | null
          property_type?: string | null
          renovation_likelihood?: string | null
          request_id?: string | null
          sale_rent_status?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          contact_person: string | null
          created_at: string
          district: string | null
          documents: Json
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone: string | null
          rating: number | null
          references_text: string | null
          service_areas: string[]
          specialty: string | null
          updated_at: string
          whatsapp: string | null
          work_regions: string[]
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          district?: string | null
          documents?: Json
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          rating?: number | null
          references_text?: string | null
          service_areas?: string[]
          specialty?: string | null
          updated_at?: string
          whatsapp?: string | null
          work_regions?: string[]
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          district?: string | null
          documents?: Json
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          rating?: number | null
          references_text?: string | null
          service_areas?: string[]
          specialty?: string | null
          updated_at?: string
          whatsapp?: string | null
          work_regions?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_partners: {
        Row: {
          agreed_cost: number | null
          created_at: string
          id: string
          partner_id: string
          project_id: string
          role: string | null
        }
        Insert: {
          agreed_cost?: number | null
          created_at?: string
          id?: string
          partner_id: string
          project_id: string
          role?: string | null
        }
        Update: {
          agreed_cost?: number | null
          created_at?: string
          id?: string
          partner_id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_public: boolean
          phase: Database["public"]["Enums"]["photo_phase"]
          project_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          phase?: Database["public"]["Enums"]["photo_phase"]
          project_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          phase?: Database["public"]["Enums"]["photo_phase"]
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          contract_total: number
          cost_total: number
          created_at: string
          customer_id: string | null
          estimated_end_date: string | null
          id: string
          is_public_reference: boolean
          material_notes: string | null
          notes: string | null
          paid_total: number
          payment_notes: string | null
          payment_status: string | null
          project_no: number
          property_id: string | null
          quote_id: string | null
          request_id: string | null
          responsible_id: string | null
          scope: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          contract_total?: number
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          estimated_end_date?: string | null
          id?: string
          is_public_reference?: boolean
          material_notes?: string | null
          notes?: string | null
          paid_total?: number
          payment_notes?: string | null
          payment_status?: string | null
          project_no?: number
          property_id?: string | null
          quote_id?: string | null
          request_id?: string | null
          responsible_id?: string | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          contract_total?: number
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          estimated_end_date?: string | null
          id?: string
          is_public_reference?: boolean
          material_notes?: string | null
          notes?: string | null
          paid_total?: number
          payment_notes?: string | null
          payment_status?: string | null
          project_no?: number
          property_id?: string | null
          quote_id?: string | null
          request_id?: string | null
          responsible_id?: string | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          area_m2: number | null
          building_age: number | null
          city: string | null
          condition: string | null
          created_at: string
          customer_id: string | null
          district: string | null
          external_ref: string | null
          id: string
          neighborhood: string | null
          notes: string | null
          photos: Json
          property_type: string | null
          room_count: string | null
          updated_at: string
          usage_status: string | null
          videos: Json
        }
        Insert: {
          address?: string | null
          area_m2?: number | null
          building_age?: number | null
          city?: string | null
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          district?: string | null
          external_ref?: string | null
          id?: string
          neighborhood?: string | null
          notes?: string | null
          photos?: Json
          property_type?: string | null
          room_count?: string | null
          updated_at?: string
          usage_status?: string | null
          videos?: Json
        }
        Update: {
          address?: string | null
          area_m2?: number | null
          building_age?: number | null
          city?: string | null
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          district?: string | null
          external_ref?: string | null
          id?: string
          neighborhood?: string | null
          notes?: string | null
          photos?: Json
          property_type?: string | null
          room_count?: string | null
          updated_at?: string
          usage_status?: string | null
          videos?: Json
        }
        Relationships: [
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_sources: {
        Row: {
          active: boolean
          approved_at: string | null
          approved_by: string | null
          auto_scan_allowed: boolean
          category: string
          created_at: string
          feed_type: string | null
          feed_url: string | null
          http_status: number | null
          id: string
          last_checked_at: string | null
          last_collect_at: string | null
          last_collect_count: number
          last_result: string | null
          name: string
          notes: string | null
          permission_status: string
          reachable: boolean | null
          region: string
          robots_allowed: boolean | null
          robots_note: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          auto_scan_allowed?: boolean
          category?: string
          created_at?: string
          feed_type?: string | null
          feed_url?: string | null
          http_status?: number | null
          id?: string
          last_checked_at?: string | null
          last_collect_at?: string | null
          last_collect_count?: number
          last_result?: string | null
          name: string
          notes?: string | null
          permission_status?: string
          reachable?: boolean | null
          region?: string
          robots_allowed?: boolean | null
          robots_note?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          auto_scan_allowed?: boolean
          category?: string
          created_at?: string
          feed_type?: string | null
          feed_url?: string | null
          http_status?: number | null
          id?: string
          last_checked_at?: string | null
          last_collect_at?: string | null
          last_collect_count?: number
          last_result?: string | null
          name?: string
          notes?: string | null
          permission_status?: string
          reachable?: boolean | null
          region?: string
          robots_allowed?: boolean | null
          robots_note?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          labor_cost: number
          labor_hourly_rate: number | null
          labor_hours: number | null
          line_total: number | null
          material_cost: number
          quantity: number
          quote_id: string
          sort_order: number
          title: string
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          labor_cost?: number
          labor_hourly_rate?: number | null
          labor_hours?: number | null
          line_total?: number | null
          material_cost?: number
          quantity?: number
          quote_id: string
          sort_order?: number
          title: string
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          labor_cost?: number
          labor_hourly_rate?: number | null
          labor_hours?: number | null
          line_total?: number | null
          material_cost?: number
          quantity?: number
          quote_id?: string
          sort_order?: number
          title?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string | null
          discount: number
          extra_total: number
          grand_total: number
          id: string
          labor_total: number
          materials_total: number
          notes: string | null
          property_id: string | null
          quote_no: number
          request_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          title: string | null
          updated_at: string
          valid_until: string | null
          vat_rate: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          extra_total?: number
          grand_total?: number
          id?: string
          labor_total?: number
          materials_total?: number
          notes?: string | null
          property_id?: string | null
          quote_no?: number
          request_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string | null
          updated_at?: string
          valid_until?: string | null
          vat_rate?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          extra_total?: number
          grand_total?: number
          id?: string
          labor_total?: number
          materials_total?: number
          notes?: string | null
          property_id?: string | null
          quote_no?: number
          request_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string | null
          updated_at?: string
          valid_until?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      renovation_requests: {
        Row: {
          address: string | null
          area_m2: number | null
          assigned_to: string | null
          budget_range: string | null
          city: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          desired_start: string | null
          district: string | null
          email: string | null
          full_name: string
          id: string
          neighborhood: string | null
          opportunity_type:
            | Database["public"]["Enums"]["opportunity_type"]
            | null
          phone: string
          photo_urls: Json
          property_id: string | null
          property_type: string | null
          renovation_type: string | null
          service_category_id: string | null
          source: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          video_urls: Json
        }
        Insert: {
          address?: string | null
          area_m2?: number | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          desired_start?: string | null
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          neighborhood?: string | null
          opportunity_type?:
            | Database["public"]["Enums"]["opportunity_type"]
            | null
          phone: string
          photo_urls?: Json
          property_id?: string | null
          property_type?: string | null
          renovation_type?: string | null
          service_category_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          video_urls?: Json
        }
        Update: {
          address?: string | null
          area_m2?: number | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          desired_start?: string | null
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          neighborhood?: string | null
          opportunity_type?:
            | Database["public"]["Enums"]["opportunity_type"]
            | null
          phone?: string
          photo_urls?: Json
          property_id?: string | null
          property_type?: string | null
          renovation_type?: string | null
          service_category_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          video_urls?: Json
        }
        Relationships: [
          {
            foreignKeyName: "renovation_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovation_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovation_requests_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      request_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["request_status"] | null
          note: string | null
          old_status: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Insert: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"] | null
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"] | null
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_activities_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          note: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          categories: string[]
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          price_info: string | null
          updated_at: string
        }
        Insert: {
          categories?: string[]
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          price_info?: string | null
          updated_at?: string
        }
        Update: {
          categories?: string[]
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          price_info?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string | null
          estimated_cost: number | null
          id: string
          is_done: boolean
          labor_notes: string | null
          material_notes: string | null
          measurements: Json
          notes: string | null
          photos: Json
          property_id: string | null
          quote_state: string | null
          request_id: string | null
          responsible_id: string | null
          responsible_name: string | null
          result: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          updated_at: string
          videos: Json
          work_items: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_cost?: number | null
          id?: string
          is_done?: boolean
          labor_notes?: string | null
          material_notes?: string | null
          measurements?: Json
          notes?: string | null
          photos?: Json
          property_id?: string | null
          quote_state?: string | null
          request_id?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          result?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string
          videos?: Json
          work_items?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_cost?: number | null
          id?: string
          is_done?: boolean
          labor_notes?: string | null
          material_notes?: string | null
          measurements?: Json
          notes?: string | null
          photos?: Json
          property_id?: string | null
          quote_state?: string | null
          request_id?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          result?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string
          videos?: Json
          work_items?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "renovation_requests"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_customer_ids: { Args: never; Returns: string[] }
      my_project_ids: { Args: never; Returns: string[] }
      my_quote_ids: { Args: never; Returns: string[] }
      my_request_ids: { Args: never; Returns: string[] }
      normalize_prospect_url: { Args: { _url: string }; Returns: string }
      recalc_quote_totals: { Args: { _quote_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "yonetici"
        | "operasyon"
        | "saha"
        | "ekip"
        | "personel"
      opportunity_type:
        | "satisa_hazirlik"
        | "kiraya_hazirlik"
        | "satis_ihtimali"
        | "kiralama_ihtimali"
        | "yatirim_yenileme"
        | "komple_yenileme"
      partner_type: "usta" | "ekip" | "firma" | "cozum_ortagi"
      photo_phase: "once" | "uygulama" | "sonra"
      project_status:
        | "baslamadi"
        | "hazirlik"
        | "malzeme_bekleniyor"
        | "basladi"
        | "devam"
        | "kontrol"
        | "tamamlandi"
        | "planlandi"
        | "beklemede"
        | "iptal"
      quote_status:
        | "taslak"
        | "hazirlaniyor"
        | "gonderildi"
        | "musteri_inceliyor"
        | "kabul"
        | "red"
        | "revizyon"
      request_status:
        | "yeni"
        | "inceleniyor"
        | "gorusuldu"
        | "kesif_planlandi"
        | "kesif_yapildi"
        | "teklif_hazirlaniyor"
        | "teklif_gonderildi"
        | "onaylandi"
        | "uygulamada"
        | "tamamlandi"
        | "iptal"
        | "is_basladi"
        | "beklemede"
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
      app_role: ["admin", "yonetici", "operasyon", "saha", "ekip", "personel"],
      opportunity_type: [
        "satisa_hazirlik",
        "kiraya_hazirlik",
        "satis_ihtimali",
        "kiralama_ihtimali",
        "yatirim_yenileme",
        "komple_yenileme",
      ],
      partner_type: ["usta", "ekip", "firma", "cozum_ortagi"],
      photo_phase: ["once", "uygulama", "sonra"],
      project_status: [
        "baslamadi",
        "hazirlik",
        "malzeme_bekleniyor",
        "basladi",
        "devam",
        "kontrol",
        "tamamlandi",
        "planlandi",
        "beklemede",
        "iptal",
      ],
      quote_status: [
        "taslak",
        "hazirlaniyor",
        "gonderildi",
        "musteri_inceliyor",
        "kabul",
        "red",
        "revizyon",
      ],
      request_status: [
        "yeni",
        "inceleniyor",
        "gorusuldu",
        "kesif_planlandi",
        "kesif_yapildi",
        "teklif_hazirlaniyor",
        "teklif_gonderildi",
        "onaylandi",
        "uygulamada",
        "tamamlandi",
        "iptal",
        "is_basladi",
        "beklemede",
      ],
    },
  },
} as const
