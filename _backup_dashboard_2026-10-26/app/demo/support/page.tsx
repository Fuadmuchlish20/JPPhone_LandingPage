import { notFound } from "next/navigation";
import { SupportView } from "@/app/dashboard/support/support-view";

export default function SupportPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <SupportView
      backHref="/demo/dashboard"
      config={{
        chatUrl: "https://example.com/chat",
        supportEmail: "support@example.com",
        businessEmail: "business@example.com",
        discordUrl: "https://discord.com",
      }}
    />
  );
}
