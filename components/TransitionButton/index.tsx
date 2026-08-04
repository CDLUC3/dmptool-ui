import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type TransitionStartFunction
} from "react";
import { Button, ButtonProps } from "react-aria-components";
import NProgress from "nprogress";
import Loading from "@/components/Loading";

interface TransitionButtonProps extends Omit<ButtonProps, "onPress"> {
  onPress?: (helpers: { startTransition: TransitionStartFunction }) => Promise<void>;
  loadingLabel?: string;
  loadingVariant?: "page" | "inline" | "minimal" | "fullscreen";
  showLoading?: boolean; // Optional prop to control loading state externally if needed
}

const TransitionButton: React.FC<TransitionButtonProps> = ({
  onPress,
  loadingLabel = "...",
  loadingVariant = "fullscreen",
  children,
  isDisabled = false,
  showLoading = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = async () => {
    if (!onPress) return; // If no onPress function is provided, do nothing
    setIsLoading(true);

    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      NProgress.start();
      window.dispatchEvent(new CustomEvent('app:navigation:start'));
    }, 100);

    try {
      // onPress is responsible for calling startTransition(() => router.push(...))
      // synchronously, at the exact point it navigates, so isPending correctly
      // tracks the real page transition instead of just the promise resolving.
      await onPress({ startTransition });
    } finally {
      setIsLoading(false);
    }
  };

  // Only finish the progress bar once BOTH the promise has resolved
  // AND React's transition (e.g. the page navigation) has actually settled.
  useEffect(() => {
    if (!isLoading && !isPending) {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
        progressTimer.current = null;
      }
      NProgress.done();
    }
  }, [isLoading, isPending]);

  // Keep the spinner alive while either the promise is unresolved
  // OR the transition (e.g. navigation) triggered inside it is still pending
  const activeLoading = onPress ? (isLoading || isPending) : isDisabled;

  return (
    <>
      {showLoading && <Loading variant={loadingVariant} isActive={activeLoading} />}
      <Button
        isDisabled={isDisabled || activeLoading}
        onPress={onPress ? handlePress : undefined}
        aria-busy={activeLoading ? "true" : undefined}
        {...props}
      >
        {activeLoading ? loadingLabel : children}
      </Button>
    </>
  );
};

export default TransitionButton;