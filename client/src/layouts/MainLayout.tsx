import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [loginOpen, setLoginOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    const path = location.split('/')[1] || 'dashboard';
    setPageTitle(path.charAt(0).toUpperCase() + path.slice(1));
  }, [location]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.username, data.password);
      setLoginOpen(false);
    } catch (error) {
      // Error is handled in the auth provider
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary mx-auto flex items-center justify-center text-white font-bold mb-4">
                DG
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">Devgiri HR</h1>
              <p className="text-neutral-500 text-sm">HR Management System</p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => setLoginOpen(true)}
            >
              Login to Access
            </Button>

            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login to Devgiri HR</DialogTitle>
                  <DialogDescription>
                    Enter your credentials to access the HR system
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          <span>Logging in...</span>
                        </div>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </Form>
                
                <DialogFooter className="text-xs text-neutral-500 pt-2">
                  <p>Default credentials: username: admin, password: admin123</p>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="mt-6 text-center text-sm text-neutral-500">
              <p>Welcome to Devgiri HR Management System</p>
              <p className="mt-1">Please login to access the system</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <TopNav onMenuToggle={() => {}} />
        
        <div className="p-6">
          {children}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
