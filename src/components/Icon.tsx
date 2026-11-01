const paths: Record<string, string> = {
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  calendar: "M5 5h14v15H5zM8 3v4m8-4v4M5 10h14m-10 4h2m3 0h2m-7 3h2",
  book: "M5 4h14v17H5zM8 4v17m3-12h5m-5 4h5",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 21v-3a7 7 0 0 1 14 0v3",
  plus: "M12 5v14M5 12h14",
  wand: "m4 19 11-11 4 4L8 23M12 11l4 4M5 3v4M3 5h4M19 2v4m-2-2h4M4 11v4m-2-2h4",
  arrow: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  star: "m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  edit: "m15 4 5 5-10 10-5 1 1-5zM13 6l5 5",
  close: "m6 6 12 12M6 18 18 6",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  leaf: "M20 4C7 2 2 10 8 16c6 6 14-1 12-12ZM5 21 16 9",
  up: "m6 14 6-6 6 6",
  down: "m6 10 6 6 6-6",
};
export default function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.sun} />
    </svg>
  );
}
