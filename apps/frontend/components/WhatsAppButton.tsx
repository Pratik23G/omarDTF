import { WhatsAppIcon } from "./icons";
import { whatsappLink } from "@/lib/whatsapp";

export default function WhatsAppButton({
  message,
  label = "Bulk order on WhatsApp",
  className,
}: {
  message: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] px-4 py-3 text-sm font-medium uppercase tracking-wide text-[#128C4A] transition hover:bg-[#25D366] hover:text-white sm:w-auto ${className ?? ""}`}
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
