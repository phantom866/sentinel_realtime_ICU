import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "wouter";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
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
              Sign in to command
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your clinician credentials to access the ICU dashboard.
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
                Sign in
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Need access?</span>{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80">
                Request an account
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-card">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
          <svg
            className="absolute inset-0 h-full w-full stroke-primary/20"
            fill="none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 L20,50 L30,20 L50,80 L60,50 L100,50"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
