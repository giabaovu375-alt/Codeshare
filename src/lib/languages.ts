export const LANGUAGES = [
  "HTML", "CSS", "JavaScript", "TypeScript", "PHP", "Python", "Java",
  "C#", "C++", "Go", "Ruby", "Dart", "Kotlin", "Swift", "Rust", "SQL", "Khác",
] as const;

export const FRAMEWORKS = [
  "None", "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt",
  "Laravel", "Django", "Flask", "Express", "NestJS", "Spring", "Flutter",
  "React Native", "WordPress", "Bootstrap", "Tailwind", "jQuery", "Khác",
] as const;

export type Language = (typeof LANGUAGES)[number];
export type Framework = (typeof FRAMEWORKS)[number];
