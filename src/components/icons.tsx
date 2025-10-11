import type { SVGProps } from 'react';

export function SilaCalcIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <g fill="currentColor">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z" />
        <path d="M168 88h-56a32 32 0 0 0-32 32v16a8 8 0 0 0 16 0v-16a16 16 0 0 1 16-16h56a8 8 0 0 0 0-16Z" />
        <path d="M88 168h56a32 32 0 0 0 32-32v-16a8 8 0 0 0-16 0v16a16 16 0 0 1-16 16H88a8 8 0 0 0 0 16Z" />
      </g>
    </svg>
  );
}
