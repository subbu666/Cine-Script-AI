import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up · CineScript" }] }),
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthCard
      mode="signup"
      onSubmit={async ({ name, email, password }) => {
        await signup(name ?? "", email, password);
        // Store email so OtpVerification can read it without prop drilling
        localStorage.setItem("cinescript_pending_email", email);
        navigate({ to: "/verify-otp" });
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </>
      }
    />
  );
}
