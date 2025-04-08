import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import MainSidebar from './MainSidebar';

interface TopNavProps {
  title: string;
}

export default function TopNav({ title }: TopNavProps) {
  const [searchValue, setSearchValue] = useState('');
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <MainSidebar />
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="w-48 pl-9 lg:w-64 h-9"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative p-1 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        <Avatar className="w-8 h-8 md:hidden">
          <AvatarImage src="" />
          <AvatarFallback className="bg-gray-200">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
