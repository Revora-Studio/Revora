import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

type PremiumButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
};

export function PremiumButton({
  children,
  onClick,
  href,
  variant = "primary",
  type = "button",
  disabled
}: PremiumButtonProps) {
  const className = `magnetic-button ${variant}`;
  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" size={18} />
    </>
  );

  if (href) {
    return (
      <motion.a className={className} href={href} whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.98 }}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={className}
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: disabled ? 0 : -3, scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {content}
    </motion.button>
  );
}
