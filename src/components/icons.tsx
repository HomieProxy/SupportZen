import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>SupportZen Logo</title>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M15.5 8.5c-1.21-.83-2.73-.9-4.04-.28-1.3.62-2.16 1.88-2.46 3.28-.3 1.4.12 2.88 1.18 3.88 1.06 1 2.5 1.28 3.88 0.9" />
    </svg>
  ),
};
