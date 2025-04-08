import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BulkImportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  jsonData: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }, "Invalid JSON format. Please enter a valid JSON array."),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkImportForm({ isOpen, onClose }: BulkImportFormProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("json");
  const [result, setResult] = useState<{
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
    results: any[];
    errors: any[];
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jsonData: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setProcessing(true);
    setResult(null);
    try {
      const jsonData = JSON.parse(values.jsonData);
      
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });
      
      const responseData = await response.json();
      setResult(responseData);
      
      if (responseData.successful > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${responseData.successful} employees.`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      }
      
      if (responseData.failed > 0) {
        toast({
          title: "Some Entries Failed",
          description: `${responseData.failed} entries couldn't be processed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import employees. Please check your data format.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setResult(null);
      form.reset();
      onClose();
    }
  };

  const sampleData = [
    {
      username: "johndoe",
      password: "securepassword",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "employee",
      department: "engineering",
      position: "Software Developer",
      phone: "+1234567890",
      joinDate: "2025-01-15"
    },
    {
      username: "janedoe",
      password: "password123",
      email: "jane.doe@example.com",
      firstName: "Jane",
      lastName: "Doe",
      role: "manager",
      department: "marketing",
      position: "Marketing Manager"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Employees</DialogTitle>
          <DialogDescription>
            Import multiple employees at once using JSON format.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Import Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/10 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-xl font-semibold">{result.processed}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-xl font-semibold text-green-600">{result.successful}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-semibold text-red-600">{result.failed}</p>
                </div>
              </div>
            </div>

            {result.successful > 0 && (
              <div>
                <h4 className="font-medium mb-2">Successfully Imported:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.results.map((employee, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium">ID {employee.id}:</span> {employee.firstName} {employee.lastName} ({employee.username})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failed > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded flex items-start">
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium">{error.username}:</span> {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                onClick={() => setResult(null)} 
                variant="outline" 
                className="mr-2"
              >
                Import More
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs defaultValue="json" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="help">Help</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="jsonData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Employee Data (JSON Array) 
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
                                  <HelpCircle className="h-3 w-3" />
                                  <span className="sr-only">Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter employee data as a JSON array. Switch to Help tab for format examples.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="[{ ... }]"
                            className="font-mono min-h-[300px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a valid JSON array with employee objects.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={handleClose} className="mr-2">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Import Employees"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="help" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Required Fields</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">username</code> - Unique username (required)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">password</code> - Password (required)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">email</code> - Email address (required)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">firstName</code> - First name (required)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">lastName</code> - Last name (required)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Optional Fields</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">role</code> - Role (admin, employee, manager)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">department</code> - Department (engineering, marketing, sales, hr, finance, operations, design, product, customer_support)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">position</code> - Job position</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">employeeId</code> - Employee ID</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">joinDate</code> - Join date (YYYY-MM-DD)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">phone</code> - Phone number</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">address</code> - Address</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(sampleData, null, 2)}
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    form.setValue("jsonData", JSON.stringify(sampleData, null, 2));
                    setActiveTab("json");
                  }}
                >
                  Use Sample Data
                </Button>
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-800">Important Note</AlertTitle>
                <AlertDescription className="text-amber-700">
                  All employees must have unique usernames. Duplicate usernames will be rejected.
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveTab("json")}>
                  Back to Import
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}