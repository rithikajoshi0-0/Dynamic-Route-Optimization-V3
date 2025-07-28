@@ .. @@
 -- Create storage bucket for map datasets
-INSERT INTO storage.buckets (name, public) 
-VALUES ('map-datasets', true)
-ON CONFLICT (name) DO NOTHING;
+INSERT INTO storage.buckets (id, name, public) 
+VALUES ('map-datasets', 'map-datasets', true)
+ON CONFLICT (id) DO NOTHING;
 
 -- Storage policies