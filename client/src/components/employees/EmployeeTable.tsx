import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmployeeTableProps {
  employees: User[];
  onSelect: (employee: User) => void;
}

export default function EmployeeTable({ employees, onSelect }: EmployeeTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);
  
  const handleDeleteClick = (employee: User) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    try {
      // If the user is already inactive, permanently delete them
      if (!employeeToDelete.isActive) {
        await apiRequest('DELETE', `/api/users/${employeeToDelete.id}/permanent`);
        toast({
          title: "Employee permanently deleted",
          description: `${employeeToDelete.firstName} ${employeeToDelete.lastName} has been permanently removed from the database.`,
        });
      } else {
        // Otherwise, just mark them as inactive
        await apiRequest('DELETE', `/api/users/${employeeToDelete.id}`);
        toast({
          title: "Employee deactivated",
          description: `${employeeToDelete.firstName} ${employeeToDelete.lastName} has been marked as inactive.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete employee",
        description: (error as Error).message || "An unexpected error occurred",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>No employees found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell onClick={() => onSelect(employee)}>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                      <div className="text-sm text-neutral-500">{employee.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={() => onSelect(employee)}>
                  {employee.employeeId || "-"}
                </TableCell>
                <TableCell onClick={() => onSelect(employee)}>
                  {employee.department ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1) : "-"}
                </TableCell>
                <TableCell onClick={() => onSelect(employee)}>
                  {employee.position || "-"}
                </TableCell>
                <TableCell onClick={() => onSelect(employee)}>
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelect(employee)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(employee)} className="text-red-600">
                        <UserX className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete?.isActive 
                ? "Are you sure you want to delete this employee? This action cannot be undone."
                : "Are you sure you want to permanently delete this inactive employee from the database? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
