-- High-Fidelity Demo Candidates SQL Seeder (fixed for generated columns)
-- Copy and paste this into your Supabase SQL Editor.

INSERT INTO public.candidates (
  id, name, email, role, github_url, skills, 
  score_technical, score_communication, score_creativity, score_culture_fit, score_growth,
  skills_score, experience_score, project_score, analysis_strengths, analysis_weaknesses, interview_questions
) VALUES 
(
  gen_random_uuid(), 
  'Sarah Jenkins', 
  'sarah.j@example.com', 
  'Senior Principal Architect', 
  'https://github.com/sarahjenkins92', 
  ARRAY['Go', 'Rust', 'Kubernetes', 'gRPC', 'PostgreSQL'], 
  98, 92, 94, 90, 95, 
  98, 95, 96, 
  '["Exceptional backend system design", "Vast experience scaling microservices in production", "Deep OSINT Open-Source contributions verified"]'::jsonb, 
  '["Less experience on the frontend (React/Vite)", "May over-architect simple MVPs"]'::jsonb, 
  '[{"type":"technical","question":"Walk me through how you handled state consistency across distributed gRPC services in your last role?"}, {"type":"behavioral","question":"How do you push back against product teams demanding unrealistic architectural timelines?"}]'::jsonb
),
(
  gen_random_uuid(), 
  'Marcus Washington', 
  'm.washington@example.com', 
  'Full Stack Product Engineer', 
  'https://github.com/marcusthedev', 
  ARRAY['React', 'TypeScript', 'Node.js', 'Express', 'TailwindCSS'], 
  82, 88, 86, 92, 85, 
  85, 80, 88, 
  '["Strong alignment with modern TS/React ecosystems", "Great product-minded focus on UI/UX", "High communication capability"]'::jsonb, 
  '["Lacks deep DevOps context", "No low-level systems programming shown"]'::jsonb, 
  '[{"type":"technical","question":"How do you optimize render cycles in a wildly complex React application?"}, {"type":"behavioral","question":"Tell me about a time you had to pivot a product feature mid-sprint."}]'::jsonb
),
(
  gen_random_uuid(), 
  'Elena Rostova', 
  'erostova@example.com', 
  'Junior Frontend Developer', 
  'https://github.com/erostova', 
  ARRAY['HTML', 'CSS', 'JavaScript', 'React'], 
  58, 75, 65, 80, 85, 
  60, 45, 68, 
  '["Highly coachable and enthusiastic", "Clean, functional React basics on recent commits", "Great potential for growth within a structured team"]'::jsonb, 
  '["Very little production scale experience", "Zero backend exposure in open-source projects", "Technical stack is highly limited"]'::jsonb, 
  '[{"type":"technical","question":"Explain the difference between useEffect and useMemo."}, {"type":"behavioral","question":"How do you handle receiving critical code review feedback from a senior engineer?"}]'::jsonb
);
