import { Link } from "react-router-dom";

/** Every index page exposes a plain <a href> for each detail URL. */
export default function CrawlableLinks({
  label,
  links,
}: {
  label: string;
  links: { href: string; text: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <nav
      aria-label={label}
      className="bg-[#121212] px-[25px] py-12 text-white md:px-[50px]"
    >
      <h2 className="mb-6 font-['Shamgod'] text-[30px] uppercase leading-none md:text-[40px]">
        {label}
      </h2>
      <ul className="flex min-w-0 flex-col gap-3">
        {links.map((link) => (
          <li key={link.href} className="min-w-0">
            <Link
              to={link.href}
              className="font-['Karla'] font-bold uppercase tracking-wider hover:text-[#FF4F00]"
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
