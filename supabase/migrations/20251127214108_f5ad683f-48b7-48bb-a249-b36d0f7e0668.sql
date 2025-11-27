-- Create weekly_menus table for storing menu items
CREATE TABLE public.weekly_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, meal_type)
);

-- Add comment
COMMENT ON TABLE public.weekly_menus IS 'Stores weekly menu items for breakfast, lunch, and dinner';

-- Enable RLS
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;

-- Admins can manage all menu items
CREATE POLICY "Admins can manage weekly menus"
  ON public.weekly_menus
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view menu items
CREATE POLICY "Authenticated users can view weekly menus"
  ON public.weekly_menus
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to weekly menus"
  ON public.weekly_menus
  FOR SELECT
  USING (false);

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_menus_updated_at
  BEFORE UPDATE ON public.weekly_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();