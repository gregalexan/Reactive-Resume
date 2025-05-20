import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SkillsDialog } from './skills';

// Setup JSDOM environment
beforeAll(() => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  });
  global.document = dom.window.document;
  global.window = dom.window;
});

// Mock the problematic modules first
vi.mock('@lingui/macro', () => ({
  t: (str: string) => str,
}));

vi.mock('@phosphor-icons/react', () => ({
  X: () => <span>X</span>,
}));

// Mock UI components - simplified version that actually renders the test ids
vi.mock('@reactive-resume/ui', () => {
  const MockComponent = (props: { 'data-testid': string }) => (
    <div data-testid={props['data-testid']} />
  );
  
  return {
    Badge: () => <MockComponent data-testid="badge" />,
    BadgeInput: () => <MockComponent data-testid="badge-input" />,
    FormControl: ({ children }: any) => <div>{children}</div>,
    FormDescription: ({ children }: any) => <div>{children}</div>,
    FormField: ({ children }: any) => <div data-testid="form-field">{children}</div>,
    FormItem: ({ children }: any) => <div>{children}</div>,
    FormLabel: () => <div data-testid="form-label" />, // Simplified mock
    FormMessage: () => <div data-testid="form-message" />,
    Input: () => <MockComponent data-testid="input" />,
    Slider: () => <MockComponent data-testid="slider" />,
  };
});

// Mock other dependAencies
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  Reorder: {
    Group: ({ children }: any) => <div data-testid="keywords-group">{children}</div>,
    Item: ({ children }: any) => <div>{children}</div>,
  },
  useDragControls: () => ({
    start: vi.fn(),
  }),
}));

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    formState: { errors: {} },
    handleSubmit: vi.fn(),
    register: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn().mockImplementation((field) => {
      if (field === 'keywords') return ['React', 'TypeScript'];
      return field === 'level' ? 3 : '';
    }),
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}));

vi.mock('@reactive-resume/schema', () => ({
  defaultSkill: {
    name: '',
    description: '',
    level: 0,
    keywords: [],
  },
  skillSchema: {},
}));

vi.mock('../sections/shared/section-dialog', () => ({
  SectionDialog: ({ children }: any) => <div data-testid="section-dialog">{children}</div>,
}));

describe('SkillsDialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkillsDialog />);
    expect(container).toBeTruthy();
  });

  it('renders basic form elements', () => {
    const { container } = render(<SkillsDialog />);
    
    // Debug output
    console.log(container.innerHTML);

    // Check for form elements - focus on what we know renders
    expect(container.querySelector('[data-testid="form-field"]')).toBeTruthy();
  });
});