import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "wouter";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && name) {
      login();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight text-primary">Sentinel</span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Request access
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register for clinician access to the ICU monitoring system.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-card"
                  placeholder="Dr. Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-card"
                  placeholder="doctor@hospital.org"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have access?</span>{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-card">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
        </div>
      </div>
    </div>
  );
}
