import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OtpVerification } from "@/components/OtpVerification";

export const Route = createFileRoute("/verify-otp")({
  component: VerifyOtpPage,
  head: () => ({ meta: [{ title: "Verify your pass · CineScript" }] }),
});

function VerifyOtpPage() {
  const navigate = useNavigate();

  return (
    <OtpVerification
      onVerified={(token) => {
        // TODO: hand the JWT to your auth context / cookie store
        // e.g. setToken(token) or queryClient.invalidateQueries()
        localStorage.removeItem("cinescript_pending_email");
        navigate({ to: "/" });
      }}
    />
  );
}
