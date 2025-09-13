
export type ToastActionElement = React.ReactNode;

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  duration?: number;
  onClose?: () => void;
  open?: boolean;
}


