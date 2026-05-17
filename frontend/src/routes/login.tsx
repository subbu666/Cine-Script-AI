import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · CineScript" }] }),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <AuthCard
      mode="login"
      onSubmit={async ({ email, password }) => {
        await login(email, password);
        navigate({ to: "/" });
      }}
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="text-gold hover:underline">
            Create an account
          </Link>
        </>
      }
    />
  );
}
