import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      data-testid="button-back"
      className="text-muted-foreground hover:text-foreground -ml-2 gap-1"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
