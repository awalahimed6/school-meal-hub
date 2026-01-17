-- Create knowledge_base table for FAQs
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Everyone can read active entries (for chatbot)
CREATE POLICY "Anyone can read active knowledge base entries"
ON public.knowledge_base
FOR SELECT
USING (is_active = true);

-- Admins can manage all entries
CREATE POLICY "Admins can manage knowledge base"
ON public.knowledge_base
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default FAQs
INSERT INTO public.knowledge_base (question, answer, category) VALUES
('Where is the cafeteria?', 'The cafeteria is located on the ground floor of the main building, next to the assembly hall.', 'location'),
('What are the meal rules?', 'Students must show their QR code to check in for meals. You can only check in once per meal. Meals cannot be taken outside the cafeteria.', 'rules'),
('Can I get a second serving?', 'Second servings are available if there is enough food remaining after all students have been served their first portion.', 'rules'),
('What if I have food allergies?', 'Please inform the cafeteria staff about your allergies. You can also update your dietary needs in your student profile settings.', 'health'),
('What time does breakfast start?', 'Check the meal schedule for exact times. Generally, breakfast is served in the morning before classes begin.', 'schedule'),
('Can I skip a meal?', 'Yes, meal attendance is optional. However, we encourage you to maintain regular eating habits for your health.', 'rules'),
('How do I report a food quality issue?', 'You can rate your meal and leave feedback through the app after checking in. Staff reviews all feedback regularly.', 'feedback');