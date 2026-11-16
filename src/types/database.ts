export type MinistryRole = 'volunteer' | 'leader'
export type CheckinMethod = 'qr' | 'manual'
export type AttendanceStatus = 'pending' | 'liberated'
export type GuestType = 'pastor' | 'cantor' | 'outro'
export type GuestStatus = 'previsto' | 'chegou' | 'concluido' | 'cancelado'

export type Profile = {
  user_id: string
  full_name: string
  email: string
  is_admin: boolean
  privacy_accepted_at: string | null
  created_at: string
  updated_at: string
}

export type Ministry = {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
}

export type MinistryMember = {
  id: string
  ministry_id: string
  user_id: string
  role: MinistryRole
  created_at: string
}

export type ServiceEvent = {
  id: string
  starts_at: string
  title: string
  created_at: string
}

export type ScheduleSlot = {
  id: string
  event_id: string
  ministry_id: string
  user_id: string
  role_label: string
  created_at: string
}

export type VolunteerUnavailability = {
  id: string
  user_id: string
  unavailable_on: string
  note: string | null
  created_at: string
}

export type ChurchCheckin = {
  id: string
  user_id: string
  event_id: string
  checked_at: string
  method: CheckinMethod
  created_by: string | null
}

export type ChurchQrCode = {
  id: string
  code: string
  label: string
  active: boolean
  created_at: string
}

export type SalaAttendance = {
  id: string
  event_id: string
  user_id: string
  status: AttendanceStatus
  arrived_at: string | null
  liberated_by: string | null
}

export type KitchenItem = {
  id: string
  name: string
  quantity: number
  unit: string
  minimum: number
  notes: string | null
  updated_at: string
  updated_by: string | null
}

export type CoffeeTodo = {
  id: string
  event_id: string | null
  title: string
  done: boolean
  sort_order: number
  created_at: string
  completed_at: string | null
  completed_by: string | null
}

export type HostGuest = {
  id: string
  name: string
  guest_type: GuestType
  arrival_at: string | null
  departure_at: string | null
  event_id: string | null
  contact: string | null
  notes: string | null
  status: GuestStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export type HostMenuItem = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export type HostGuestMenu = {
  id: string
  guest_id: string
  menu_item_id: string
  notes: string | null
}

export type HostDishwareItem = {
  id: string
  name: string
  quantity: number
  unit: string
  minimum: number
  notes: string | null
  updated_at: string
  updated_by: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      ministries: { Row: Ministry; Insert: Partial<Ministry>; Update: Partial<Ministry> }
      ministry_members: {
        Row: MinistryMember
        Insert: Partial<MinistryMember>
        Update: Partial<MinistryMember>
      }
      service_events: {
        Row: ServiceEvent
        Insert: Partial<ServiceEvent>
        Update: Partial<ServiceEvent>
      }
      schedule_slots: {
        Row: ScheduleSlot
        Insert: Partial<ScheduleSlot>
        Update: Partial<ScheduleSlot>
      }
      church_checkins: {
        Row: ChurchCheckin
        Insert: Partial<ChurchCheckin>
        Update: Partial<ChurchCheckin>
      }
      church_qr_codes: {
        Row: ChurchQrCode
        Insert: Partial<ChurchQrCode>
        Update: Partial<ChurchQrCode>
      }
      sala_attendance: {
        Row: SalaAttendance
        Insert: Partial<SalaAttendance>
        Update: Partial<SalaAttendance>
      }
      kitchen_items: {
        Row: KitchenItem
        Insert: Partial<KitchenItem>
        Update: Partial<KitchenItem>
      }
      coffee_todos: {
        Row: CoffeeTodo
        Insert: Partial<CoffeeTodo>
        Update: Partial<CoffeeTodo>
      }
      host_guests: {
        Row: HostGuest
        Insert: Partial<HostGuest>
        Update: Partial<HostGuest>
      }
      host_menu_items: {
        Row: HostMenuItem
        Insert: Partial<HostMenuItem>
        Update: Partial<HostMenuItem>
      }
      host_guest_menu: {
        Row: HostGuestMenu
        Insert: Partial<HostGuestMenu>
        Update: Partial<HostGuestMenu>
      }
      host_dishware_items: {
        Row: HostDishwareItem
        Insert: Partial<HostDishwareItem>
        Update: Partial<HostDishwareItem>
      }
    }
  }
}
