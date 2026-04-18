-- Create Brandon's admin profile if it doesn't exist

INSERT INTO agent_profiles (user_id, email, role, opens_goal, monthly_income_goal, annual_income_goal)
VALUES (
  'b5c2c7d8-cb11-4b00-a820-14f6c1e64b93',
  'BrandonBLKGroup@Gmail.com',
  'admin',
  75,
  67000,
  800000
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  email = 'BrandonBLKGroup@Gmail.com';
