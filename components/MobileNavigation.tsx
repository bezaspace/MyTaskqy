"use client";

import { useState } from 'react';
import { Menu, X, Plus, Clock, Calendar, MessageSquare, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface MobileNavigationProps {
  onCreateTask: () => void;
  onScheduleTask: () => void;
  onSignOut: () => void;
  showSignOut?: boolean;
}

export function MobileNavigation({ 
  onCreateTask, 
  onScheduleTask, 
  onSignOut, 
  showSignOut = false 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="bg-zinc-900 border-zinc-800 text-white w-80"
        >
          <SheetTitle className="text-lg font-semibold text-yellow-400 mb-4">
            Quick Actions
          </SheetTitle>
          <SheetDescription className="sr-only">
            Mobile navigation menu with quick actions and navigation links
          </SheetDescription>
          <div className="flex flex-col space-y-4 mt-4">
            
            <Button 
              onClick={() => {
                onCreateTask();
                closeMenu();
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold justify-start"
            >
              <Plus className="w-4 h-4 mr-3" />
              Start Task Now
            </Button>
            
            <Button 
              onClick={() => {
                onScheduleTask();
                closeMenu();
              }}
              variant="outline"
              className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold justify-start"
            >
              <Clock className="w-4 h-4 mr-3" />
              Schedule Task
            </Button>
            
            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Navigation</h3>
              
              <Link href="/timeline" onClick={closeMenu}>
                <Button 
                  variant="ghost"
                  className="w-full text-purple-400 hover:bg-purple-400/10 justify-start"
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Timeline View
                </Button>
              </Link>
              
              <Link href="/chat" onClick={closeMenu}>
                <Button 
                  variant="ghost"
                  className="w-full text-blue-400 hover:bg-blue-400/10 justify-start"
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  AI Assistant
                </Button>
              </Link>
            </div>
            
            {showSignOut && (
              <div className="border-t border-zinc-700 pt-4">
                <Button
                  onClick={() => {
                    onSignOut();
                    closeMenu();
                  }}
                  variant="ghost"
                  className="w-full text-red-400 hover:bg-red-400/10 justify-start"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}