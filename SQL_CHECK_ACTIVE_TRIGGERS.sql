-- Ver qué triggers están ACTIVOS en enrollment_grades
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'enrollment_grades'
ORDER BY trigger_name;
