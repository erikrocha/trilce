import type { ClassGroupBrief } from "@/lib/class-group";
import type { Database } from "@/lib/supabase/database.types";

export type QuizSessionStatus = Database["public"]["Enums"]["quiz_session_status"];

export type QuestionOption = {
  id: string;
  label: string;
  text: string;
  is_correct: boolean;
  order_index: number;
};

export type QuestionWithOptions = {
  id: string;
  text: string;
  order_index: number;
  quiz_question_options: QuestionOption[];
};

export type OfferingOption = {
  id: string;
  class_group_id: string;
  courses: { name: string } | null;
  class_groups: ClassGroupBrief | null;
  staff_members: { full_name: string } | null;
};

export type SessionRow = {
  id: string;
  status: QuizSessionStatus;
  course_offering_id: string;
  course_offerings: {
    courses: { name: string } | null;
    class_groups: ClassGroupBrief | null;
    staff_members: { full_name: string } | null;
  } | null;
};
