
export const useScrollToTop = () => {

  const scrollToTop = (myRef: React.RefObject<HTMLDivElement | null>) => {
    if (myRef.current) {
      myRef.current.scrollIntoView({ behavior: 'smooth' });
      myRef.current.focus();
    }
  };

  return { scrollToTop };
};