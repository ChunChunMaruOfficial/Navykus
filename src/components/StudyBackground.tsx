import {
  Atom,
  Award,
  Beaker,
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Compass,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Library,
  Lightbulb,
  Map,
  Medal,
  Microscope,
  Network,
  NotebookPen,
  Palette,
  PenTool,
  Presentation,
  Puzzle,
  Rocket,
  Ruler,
  School,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

type StudyIconConfig = {
  Icon: LucideIcon;
  color: string;
  left?: string;
  right?: string;
  top: string;
  size: number;
  rotate: number;
  opacity: number;
  drift: number;
  delay: number;
};

const STUDY_ICONS: StudyIconConfig[] = [
  { Icon: BookOpen, left: '6%', top: '9%', size: 25, rotate: -12, color: '#bc4638', opacity: 0.22, drift: 12, delay: -2 },
  { Icon: GraduationCap, right: '6%', top: '11%', size: 29, rotate: 10, color: '#bd5b82', opacity: 0.22, drift: -11, delay: -8 },
  { Icon: Calculator, left: '10%', top: '20%', size: 21, rotate: 13, color: '#6b8f71', opacity: 0.19, drift: -9, delay: -4 },
  { Icon: FlaskConical, right: '10%', top: '23%', size: 24, rotate: -9, color: '#c9a96e', opacity: 0.20, drift: 10, delay: -11 },
  { Icon: Brain, left: '5%', top: '34%', size: 29, rotate: 8, color: '#9d6072', opacity: 0.21, drift: 12, delay: -6 },
  { Icon: Atom, right: '5%', top: '36%', size: 27, rotate: -16, color: '#3d6b8f', opacity: 0.21, drift: -12, delay: -13 },
  { Icon: Palette, left: '9%', top: '49%', size: 24, rotate: -7, color: '#bd5b82', opacity: 0.19, drift: -9, delay: -3 },
  { Icon: Microscope, right: '9%', top: '50%', size: 27, rotate: 12, color: '#bc4638', opacity: 0.21, drift: 11, delay: -9 },
  { Icon: Trophy, left: '6%', top: '64%', size: 24, rotate: 16, color: '#c9a96e', opacity: 0.20, drift: 9, delay: -15 },
  { Icon: PenTool, right: '6%', top: '66%', size: 22, rotate: -12, color: '#6b8f71', opacity: 0.19, drift: -9, delay: -5 },
  { Icon: Rocket, left: '11%', top: '78%', size: 27, rotate: 12, color: '#bc4638', opacity: 0.20, drift: -12, delay: -10 },
  { Icon: Lightbulb, right: '11%', top: '80%', size: 24, rotate: -10, color: '#bd5b82', opacity: 0.20, drift: 10, delay: -1 },
  { Icon: Compass, left: '5%', top: '91%', size: 23, rotate: -15, color: '#3d6b8f', opacity: 0.18, drift: 8, delay: -7 },
  { Icon: Globe2, right: '5%', top: '93%', size: 25, rotate: 9, color: '#6b8f71', opacity: 0.18, drift: -8, delay: -12 },
  { Icon: NotebookPen, left: '13%', top: '14%', size: 20, rotate: 6, color: '#9d6072', opacity: 0.15, drift: 7, delay: -14 },
  { Icon: School, right: '13%', top: '18%', size: 21, rotate: -8, color: '#bc4638', opacity: 0.15, drift: -8, delay: -6 },
  { Icon: Ruler, left: '12%', top: '42%', size: 19, rotate: 24, color: '#c9a96e', opacity: 0.15, drift: 7, delay: -9 },
  { Icon: Puzzle, right: '12%', top: '43%', size: 20, rotate: -18, color: '#bd5b82', opacity: 0.15, drift: -7, delay: -3 },
  { Icon: Code2, left: '13%', top: '58%', size: 21, rotate: -10, color: '#3d6b8f', opacity: 0.15, drift: -7, delay: -5 },
  { Icon: Presentation, right: '13%', top: '59%', size: 22, rotate: 11, color: '#6b8f71', opacity: 0.16, drift: 7, delay: -10 },
  { Icon: Library, left: '12%', top: '86%', size: 20, rotate: 8, color: '#bc4638', opacity: 0.15, drift: 6, delay: -2 },
  { Icon: Medal, right: '12%', top: '88%', size: 21, rotate: -10, color: '#c9a96e', opacity: 0.16, drift: -6, delay: -8 },
  { Icon: Beaker, left: '8%', top: '27%', size: 19, rotate: -5, color: '#bd5b82', opacity: 0.15, drift: 6, delay: -12 },
  { Icon: Network, right: '8%', top: '30%', size: 20, rotate: 9, color: '#9d6072', opacity: 0.15, drift: -6, delay: -4 },
  { Icon: Map, left: '8%', top: '72%', size: 20, rotate: -15, color: '#6b8f71', opacity: 0.15, drift: 6, delay: -6 },
  { Icon: Languages, right: '8%', top: '73%', size: 20, rotate: 14, color: '#3d6b8f', opacity: 0.15, drift: -6, delay: -11 },
  { Icon: Landmark, left: '14%', top: '31%', size: 19, rotate: 5, color: '#c9a96e', opacity: 0.14, drift: 5, delay: -1 },
  { Icon: Award, right: '14%', top: '75%', size: 19, rotate: -8, color: '#bc4638', opacity: 0.15, drift: -5, delay: -13 },
  { Icon: BookOpen, left: '15%', top: '6%', size: 18, rotate: 18, color: '#6b8f71', opacity: 0.13, drift: -5, delay: -16 },
  { Icon: Brain, right: '15%', top: '7%', size: 19, rotate: -14, color: '#c9a96e', opacity: 0.14, drift: 5, delay: -19 },
  { Icon: Code2, left: '4%', top: '16%', size: 18, rotate: -18, color: '#3d6b8f', opacity: 0.15, drift: 6, delay: -18 },
  { Icon: Ruler, right: '4%', top: '15%', size: 18, rotate: 22, color: '#bd5b82', opacity: 0.15, drift: -6, delay: -21 },
  { Icon: Puzzle, left: '15%', top: '25%', size: 18, rotate: 11, color: '#bc4638', opacity: 0.13, drift: 5, delay: -20 },
  { Icon: NotebookPen, right: '15%', top: '27%', size: 18, rotate: -12, color: '#6b8f71', opacity: 0.13, drift: -5, delay: -17 },
  { Icon: Presentation, left: '4%', top: '39%', size: 19, rotate: -9, color: '#c9a96e', opacity: 0.14, drift: 6, delay: -22 },
  { Icon: Library, right: '4%', top: '40%', size: 18, rotate: 15, color: '#3d6b8f', opacity: 0.14, drift: -6, delay: -24 },
  { Icon: FlaskConical, left: '15%', top: '46%', size: 18, rotate: 16, color: '#bd5b82', opacity: 0.13, drift: -5, delay: -25 },
  { Icon: Calculator, right: '15%', top: '47%', size: 18, rotate: -16, color: '#bc4638', opacity: 0.13, drift: 5, delay: -23 },
  { Icon: Globe2, left: '4%', top: '55%', size: 19, rotate: -13, color: '#6b8f71', opacity: 0.14, drift: 6, delay: -26 },
  { Icon: Compass, right: '4%', top: '56%', size: 18, rotate: 17, color: '#c9a96e', opacity: 0.14, drift: -6, delay: -28 },
  { Icon: Lightbulb, left: '15%', top: '68%', size: 18, rotate: -10, color: '#3d6b8f', opacity: 0.13, drift: 5, delay: -27 },
  { Icon: Microscope, right: '15%', top: '69%', size: 19, rotate: 13, color: '#bd5b82', opacity: 0.13, drift: -5, delay: -30 },
  { Icon: Network, left: '4%', top: '82%', size: 18, rotate: 12, color: '#bc4638', opacity: 0.14, drift: -6, delay: -29 },
  { Icon: Rocket, right: '4%', top: '84%', size: 19, rotate: -15, color: '#6b8f71', opacity: 0.14, drift: 6, delay: -31 },
  { Icon: Medal, left: '15%', top: '95%', size: 18, rotate: 10, color: '#c9a96e', opacity: 0.13, drift: 5, delay: -32 },
  { Icon: Trophy, right: '15%', top: '96%', size: 18, rotate: -11, color: '#3d6b8f', opacity: 0.13, drift: -5, delay: -34 },
];

export default function StudyBackground({ className = '' }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion();
  const scrollDrift = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-18, 34]);
  const y = useSpring(scrollDrift, { stiffness: 42, damping: 18, mass: 0.7 });

  return (
    <div className={`pointer-events-none absolute inset-y-0 left-1/2 z-[1] w-[108vw] -translate-x-1/2 overflow-hidden ${className}`} aria-hidden="true">
      {STUDY_ICONS.map(({ Icon, color, left, right, top, size, rotate, opacity, drift, delay }, index) => (
        <motion.div
          key={index}
          className="study-bg-icon absolute hidden sm:block"
          initial={{ rotate }}
          animate={reducedMotion ? { x: 0, rotate } : { x: [0, drift, -drift * 0.45, 0], rotate: [rotate, rotate + 3, rotate - 2, rotate] }}
          transition={{
            duration: 14 + (index % 5) * 2.5,
            repeat: Infinity,
            type: 'spring',
            stiffness: 18,
            damping: 7,
            delay,
          }}
          style={{
            left,
            right,
            top,
            y,
            color,
            opacity: Math.min(opacity + 0.025, 0.25),
            width: size * (0.94 + (index % 5) * 0.035),
            height: size * (0.94 + (index % 5) * 0.035),
          }}
        >
          <Icon className="h-full w-full" strokeWidth={1.45} />
        </motion.div>
      ))}
    </div>
  );
}
