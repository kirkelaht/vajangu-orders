-- Create views for routes API
-- This creates views that the routes API can use to query rings and stops

-- View for full route information (ring + stops)
CREATE OR REPLACE VIEW vw_routes_full AS
SELECT 
  r.id as route_id,
  r.region,
  r."ringDate",
  r."visibleFrom",
  r."visibleTo",
  r."cutoffAt",
  r.status,
  r.driver,
  s.id as stop_id,
  s.name as stop_name,
  s.place,
  s."order_index" as stop_order,
  s."meetingPoint"
FROM "Ring" r
LEFT JOIN "Stop" s ON r.id = s."ringId"
ORDER BY r."ringDate", s."order_index";

-- View for route dates mapping
CREATE OR REPLACE VIEW vw_route_dates_map AS
SELECT 
  id as route_id,
  region,
  "ringDate" as route_date,
  status,
  driver
FROM "Ring"
ORDER BY "ringDate";

