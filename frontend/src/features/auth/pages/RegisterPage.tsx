import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<void> => {
    await register(email, password, fullName);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Get started with PlanApp</p>
        </div>
        <RegisterForm onSubmit={handleSubmit} />
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
