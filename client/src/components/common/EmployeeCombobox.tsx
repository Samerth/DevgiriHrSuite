import * as React from "react"
import { Check, ChevronsUpDown, User, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useQuery } from "@tanstack/react-query"
import { FormControl } from "@/components/ui/form"

interface EmployeeComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function EmployeeCombobox({ 
  value, 
  onValueChange, 
  placeholder = "Select employee", 
  disabled = false 
}: EmployeeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["/api/employees"],
  })

  // Filter employees based on search term
  const filteredEmployees = React.useMemo(() => {
    if (!employeesData) return []
    if (!searchTerm) return employeesData

    const searchTermLower = searchTerm.toLowerCase()
    return employeesData.filter((employee: any) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase()
      const employeeId = employee.employeeId?.toLowerCase() || ""
      const department = employee.department?.toLowerCase() || ""
      
      return (
        fullName.includes(searchTermLower) || 
        employeeId.includes(searchTermLower) ||
        department.includes(searchTermLower)
      )
    })
  }, [employeesData, searchTerm])

  // Get selected employee name
  const getEmployeeName = React.useCallback(() => {
    if (!value || !employeesData) return placeholder
    
    const selectedEmployee = employeesData.find((employee: any) => employee.id.toString() === value)
    if (!selectedEmployee) return placeholder

    return `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
  }, [value, employeesData, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {getEmployeeName()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search employee..." 
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
              {filteredEmployees.map((employee: any) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id.toString()}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center">
                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {employee.employeeId && (
                          <span className="mr-2">ID: {employee.employeeId}</span>
                        )}
                        {employee.department && (
                          <span className="flex items-center">
                            <Building className="mr-1 h-3 w-3" />
                            {employee.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === employee.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}