import type { ClassGroupBrief } from "@/lib/class-group";
import type { Database } from "@/lib/supabase/database.types";

export type SchedulePeriod = Database["public"]["Tables"]["schedule_periods"]["Row"];

export type OfferingOption = {
  id: string;
  class_group_id: string;
  courses: { name: string; short_code: string | null } | null;
  class_groups: ClassGroupBrief | null;
  staff_members: { full_name: string } | null;
};

export type ActivityOption = { id: string; name: string };

export type ScheduleSlotRow = {
  id: string;
  period_id: string;
  day_of_week: number;
  course_offering_id: string | null;
  activity_id: string | null;
  classroom: string | null;
  course_offerings: {
    id: string;
    class_group_id: string;
    teacher_id: string;
    courses: { name: string; short_code: string | null } | null;
    class_groups: ClassGroupBrief | null;
    staff_members: { full_name: string } | null;
  } | null;
  schedule_activities: { name: string } | null;
};
