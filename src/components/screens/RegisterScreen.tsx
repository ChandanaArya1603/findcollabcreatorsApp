import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";

interface Props {
  onSwitch: () => void;
}

const RegisterScreen: React.FC<Props> = ({ onSwitch }) => {
  const { register } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactno, setContactno] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstname.trim() || !email.trim() || !password.trim() || !contactno.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ firstname, email, password, contactno });
      if (res.verification_required) {
        toast.success("Registration successful! Check your email to verify.");
        onSwitch();
      } else {
        toast.success("Registered and logged in!");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-primary mb-1">Findcollab</h1>
          <p className="text-sm text-text-mid">Create your influencer account</p>
        </div>
        <Card className="!p-5">
          <div className="flex flex-col gap-3.5">
            <AppInput label="First Name" value={firstname} onChange={setFirstname} placeholder="John" />
            <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <AppInput label="Phone Number" value={contactno} onChange={setContactno} placeholder="+91 98765 43210" />
            <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            <AppButton full onClick={handleRegister} disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </AppButton>
          </div>
        </Card>
        <p className="text-center text-xs text-text-mid mt-5">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-bold">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
