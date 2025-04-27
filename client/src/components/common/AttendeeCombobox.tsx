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
import { apiRequest } from "@/lib/queryClient"

interface AttendeeComboboxProps {
  trainingId: number
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function AttendeeCombobox({ 
  trainingId,
  value, 
  onValueChange, 
  placeholder = "Select attendee", 
  disabled = false 
}: AttendeeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const { data: attendeesData, isLoading } = useQuery({
    queryKey: [`/api/training-records/${trainingId}/attendees`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/training-records/${trainingId}/attendees`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch attendees: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching attendees:", error);
        return [];
      }
    },
    enabled: !!trainingId
  })

  // Filter attendees based on search term
  const filteredAttendees = React.useMemo(() => {
    if (!attendeesData) return []
    if (!searchTerm) return attendeesData

    const searchTermLower = searchTerm.toLowerCase()
    return attendeesData.filter((attendee: any) => {
      const fullName = `${attendee.firstName} ${attendee.lastName}`.toLowerCase()
      const employeeId = attendee.employeeId?.toLowerCase() || ""
      const department = attendee.department?.toLowerCase() || ""
      
      return (
        fullName.includes(searchTermLower) || 
        employeeId.includes(searchTermLower) ||
        department.includes(searchTermLower)
      )
    })
  }, [attendeesData, searchTerm])

  // Get selected attendee name
  const getAttendeeName = React.useCallback(() => {
    if (!value || !attendeesData) return placeholder
    
    const selectedAttendee = attendeesData.find((attendee: any) => attendee.id.toString() === value)
    if (!selectedAttendee) return placeholder

    return `${selectedAttendee.firstName} ${selectedAttendee.lastName}`
  }, [value, attendeesData, placeholder])

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
            disabled={disabled || isLoading}
          >
            {isLoading ? "Loading..." : getAttendeeName()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search attendee..." 
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No attendee found.</CommandEmpty>
            <CommandGroup>
              {filteredAttendees.map((attendee: any) => (
                <CommandItem
                  key={attendee.id}
                  value={attendee.id.toString()}
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
                        {attendee.firstName} {attendee.lastName}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {attendee.employeeId && (
                          <span className="mr-2">ID: {attendee.employeeId}</span>
                        )}
                        {attendee.department && (
                          <span className="flex items-center">
                            <Building className="mr-1 h-3 w-3" />
                            {attendee.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === attendee.id.toString() ? "opacity-100" : "opacity-0"
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