import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PictureSection } from './section';

// Mock the necessary dependencies
vi.mock('@lingui/macro', () => ({
  t: (key: string) => key,
}));

vi.mock('@reactive-resume/ui', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ src }: { src: string }) => <img src={src} alt="avatar" />,
  buttonVariants: () => '',
  Input: ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input value={value} onChange={onChange} />
  ),
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@reactive-resume/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  },
}));

vi.mock('react-image-crop', () => ({
  ReactCrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  centerCrop: vi.fn(),
  makeAspectCrop: vi.fn(),
  convertToPixelCrop: vi.fn(),
}));

vi.mock('@/client/services/storage', () => ({
  useUploadImage: () => ({
    uploadImage: vi.fn(),
  }),
}));

vi.mock('@/client/stores/resume', () => ({
  useResumeStore: () => ({
    setValue: vi.fn(),
    resume: {
      data: {
        basics: {
          picture: {
            url: '',
          },
        },
      },
    },
  }),
}));

vi.mock('@/client/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('./options', () => ({
  PictureOptions: () => <div>PictureOptions</div>,
}));

describe('PictureSection', () => {
    beforeAll(() => {
    // Mock the document
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    });

    it('renders without crashing', () => {
    const { container } = render(<PictureSection />);
    expect(container).toBeTruthy();
    });
    it('renders without crashing', () => {
        const { container } = render(<PictureSection />);
        expect(container).toBeTruthy();
    });

    it('renders input element', () => {
        const { container } = render(<PictureSection />);
        const input = container.querySelector('input[type="file"]');
        expect(input).not.toBeNull();
    });

    it('has a label for the picture url input', () => {
        const { container } = render(<PictureSection />);
        const label = container.querySelector('label');
        expect(label?.textContent).toContain('Picture');
    });
});